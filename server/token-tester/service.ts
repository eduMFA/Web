import {createHash, randomBytes} from "node:crypto";
import {
    eduMfaSession,
    enrollIndexedSecret,
    enrollToken,
    finishPasskey,
    listTesterInventory,
    listTokens,
    readChallenge,
    removeToken,
    startPasskey,
    testerDescriptionPrefix,
    triggerChallenge,
    triggerIndexedChallenge,
    triggerPasskeyChallenge,
    verifyPasskeyChallenge,
    verifyIndexedSecret,
    verifyTotp,
    type PasskeyAccount,
} from "./edumfa.ts";
import {openInventory} from "./inventory.ts";
import {createTrafficLimits} from "./traffic.ts";

type Config = {
    origin: string;
    instanceUrl: string;
    username: string;
    password: string;
    realm?: string;
    databasePath: string;
    maxTokens: number;
    tokenLifetimeMs: number;
    passkeyAccount?: PasskeyAccount;
};

export function createTesterService(config: Config) {
    const upstream = eduMfaSession(config.instanceUrl, config.username, config.password, config.realm);
    const inventory = openInventory(config.databasePath);
    const traffic = createTrafficLimits();
    const writing = new Set<string>();
    const passkeyTransactions = new Map<string, string>();
    const passkeyChallenges = new Map<string, {id: string; expiresAt: number}>();
    const indexedChallenges = new Map<string, {id: string; length: number}>();
    const challenged = new Map<string, number>();
    let minute = 0;
    let enrollments = 0;
    let challenges = 0;
    const headers = {
        "Access-Control-Allow-Origin": config.origin,
        "Access-Control-Allow-Headers": "Authorization",
        "Access-Control-Allow-Methods": "GET, POST, DELETE",
        "Cache-Control": "no-store",
        Vary: "Origin",
    };

    const json = (value: unknown, status = 200) => Response.json(value, {status, headers});
    const error = (message: string, status: number) => json({error: message}, status);

    async function initialize() {
        const tokens = await upstream(listTesterInventory);
        const expiresAt = Date.now() + config.tokenLifetimeMs;
        for (const token of tokens) inventory.importToken({...token, expiresAt});
    }

    let cleaning = false;
    async function cleanup() {
        if (cleaning) return;
        cleaning = true;
        try {
            for (const token of inventory.expired(Date.now())) {
                const {serial, description} = token;
                if (writing.has(description)) continue;
                writing.add(description);
                try {
                    const matches = await upstream((connection) => listTokens(connection, description, serial));
                    if (matches.some((match) => match.serial === serial)) {
                        await upstream((connection) => removeToken(connection, serial));
                    }
                    inventory.remove(serial, description);
                    passkeyTransactions.delete(serial);
                    passkeyChallenges.delete(serial);
                    indexedChallenges.delete(serial);
                } catch {
                    inventory.retry(token, Date.now() + 300_000);
                    console.error("Could not clean up an expired Token tester token. Cleanup will retry.");
                } finally {
                    writing.delete(description);
                }
            }
        } finally {
            cleaning = false;
        }
    }

    async function handle(request: Request, address: string, readBody: () => Promise<string> = () => request.text()) {
        if (request.headers.get("Origin") !== config.origin) return new Response(null, {status: 403});
        if (request.method === "OPTIONS") return new Response(null, {status: 204, headers});

        const key = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get("Authorization") ?? "")?.[1];
        if (!key) return error("A tester browser key is required.", 401);
        const owner = createHash("sha256").update(key).digest("hex").slice(0, 32);
        const description = testerDescriptionPrefix + owner;

        const url = new URL(request.url);
        const {method} = request;
        const passkeyAccount = config.passkeyAccount;
        const list = url.pathname === "/tokens";
        const match = /^\/tokens\/([\w-]{1,128})(?:\/(challenge|otp|indexed-challenge|indexed-response))?$/.exec(
            url.pathname,
        );
        const passkey =
            method === "POST" &&
            !!passkeyAccount &&
            /^\/passkeys(?:\/([\w-]{1,128})(?:\/(challenge|assertion))?)?$/.exec(url.pathname);
        const passkeyAction = passkey ? passkey[2] : undefined;
        const serial = match?.[1] ?? (passkey ? passkey[1] : undefined);
        const enrolling = method === "POST" && (list || (!!passkey && !serial));
        const challenge = match?.[2] === "challenge";
        const otp = match?.[2] === "otp";
        const indexedAction = match?.[2] === "indexed-challenge" || match?.[2] === "indexed-response";
        const enrollmentType = url.searchParams.get("type");
        const id = url.searchParams.get("id");
        if (!(
            passkey ||
            (list && (method === "GET" || method === "POST")) ||
            (serial &&
                (challenge
                    ? method === "POST" || (method === "GET" && id && /^[\w-]{1,128}$/.test(id))
                    : method === (match?.[2] ? "POST" : "DELETE")))
        )) {
            return error("Tester action not found.", 404);
        }

        const write = method !== "GET";
        if (write && writing.has(description)) return error("Wait for the current token action to finish.", 409);
        if (!traffic.admit(address, enrolling, Date.now())) {
            return error("Too many tester requests. Try again shortly.", 429);
        }
        if (write) writing.add(description);
        try {
            if (list && method === "GET") {
                const tokens = await upstream((connection) => listTokens(connection, description));
                const now = Date.now();
                return json(tokens.filter((token) => inventory.isActive(token.serial, description, now)));
            }
            if (serial) {
                if (!inventory.isActive(serial, description, Date.now())) return error("Test token not found.", 404);
                const tokens = await upstream((connection) => listTokens(connection, description, serial));
                const token = tokens.find((token) => token.serial === serial);
                if (!token) return error("Test token not found.", 404);
                if (method === "DELETE") {
                    await upstream((connection) => removeToken(connection, serial));
                    inventory.remove(serial, description);
                    passkeyTransactions.delete(serial);
                    passkeyChallenges.delete(serial);
                    indexedChallenges.delete(serial);
                    return json(null);
                }
                if (passkey && passkeyAccount && !passkeyAction) {
                    if (token.type !== "passkey" || token.enrolled)
                        return error("Passkey enrollment is not pending.", 409);
                    let body: string;
                    try {
                        body = await readBody();
                    } catch {
                        return error("Invalid passkey registration response.", 400);
                    }
                    const submitted = new URLSearchParams(body);
                    const transaction = submitted.get("transaction_id");
                    const clientdata = submitted.get("clientdata");
                    const regdata = submitted.get("regdata");
                    const extensions = submitted.get("registrationclientextensions");
                    if (
                        !transaction ||
                        !/^[\w-]{1,128}$/.test(transaction) ||
                        !clientdata ||
                        !/^[\w-]+$/.test(clientdata) ||
                        !regdata ||
                        !/^[\w-]+$/.test(regdata) ||
                        (extensions && !/^[\w-]+$/.test(extensions)) ||
                        Buffer.byteLength(body) > 65_536
                    ) {
                        return error("Invalid passkey registration response.", 400);
                    }
                    const fields = new URLSearchParams({transaction_id: transaction, clientdata, regdata});
                    if (passkeyTransactions.get(serial) !== transaction) {
                        return error(
                            "Passkey registration has expired. Remove the pending passkey and enroll again.",
                            409,
                        );
                    }
                    if (extensions) fields.set("registrationclientextensions", extensions);
                    await upstream((connection) =>
                        finishPasskey(connection, config.origin, passkeyAccount, serial, fields),
                    );
                    passkeyTransactions.delete(serial);
                    return json({serial, type: "passkey", enrolled: true, active: token.active});
                }
                if (
                    token.type !== (otp ? "totp" : indexedAction ? "indexedsecret" : passkeyAction ? "passkey" : "push")
                ) {
                    return error("Challenge type does not match this token.", 409);
                }
                if (id && method === "GET")
                    return json(await upstream((connection) => readChallenge(connection, serial, id)));
                if (!token.enrolled || !token.active) return error("The test token is not active and enrolled.", 409);
                if (passkeyAction === "assertion" && passkeyAccount) {
                    const challenge = passkeyChallenges.get(serial);
                    if (!challenge || challenge.expiresAt <= Date.now()) {
                        passkeyChallenges.delete(serial);
                        return error("Passkey challenge expired. Start another verification.", 409);
                    }
                    let body: string;
                    try {
                        body = await readBody();
                    } catch {
                        return error("Invalid passkey assertion.", 400);
                    }
                    if (Buffer.byteLength(body) > 65_536) return error("Invalid passkey assertion.", 400);
                    const submitted = new URLSearchParams(body);
                    if (submitted.get("transaction_id") !== challenge.id)
                        return error("Invalid passkey challenge.", 409);
                    const fields = new URLSearchParams({transaction_id: challenge.id});
                    for (const field of ["credentialid", "clientdata", "signaturedata", "authenticatordata"]) {
                        const value = submitted.get(field);
                        if (!value || !/^[\w-]+$/.test(value)) return error("Invalid passkey assertion.", 400);
                        fields.set(field, value);
                    }
                    passkeyChallenges.delete(serial);
                    return json(
                        await upstream((connection) =>
                            verifyPasskeyChallenge(connection, config.origin, passkeyAccount, serial, fields),
                        ),
                    );
                }
            }

            const now = Date.now();
            const currentMinute = Math.floor(now / 60_000);
            if (minute !== currentMinute) {
                minute = currentMinute;
                enrollments = 0;
                challenges = 0;
            }
            if (serial) {
                if (match?.[2] === "indexed-response") {
                    const pending = indexedChallenges.get(serial);
                    if (!pending) return json("expired");
                    const body = await readBody().catch(() => "");
                    const submitted = new URLSearchParams(body);
                    const answer = submitted.get("answer");
                    if (submitted.get("transaction_id") !== pending.id) return json("expired");
                    if (
                        body.length > 256 ||
                        !answer ||
                        answer.length !== pending.length ||
                        !/^[A-Za-z0-9]+$/.test(answer)
                    ) {
                        return error("Enter one character for each requested cell.", 400);
                    }
                    if (challenges >= 30) return error("Verification is busy. Try again in a minute.", 429);
                    challenges++;
                    indexedChallenges.delete(serial);
                    return json(
                        await upstream((connection) => verifyIndexedSecret(connection, serial, pending.id, answer)),
                    );
                }
                if (otp) {
                    let body: string;
                    try {
                        body = await readBody();
                    } catch {
                        return error("Enter a six-digit code.", 400);
                    }
                    const code = new URLSearchParams(body).get("code");
                    if (body.length > 256 || !code || !/^[0-9]{6}$/.test(code)) {
                        return error("Enter a six-digit code.", 400);
                    }
                    if (challenges >= 30) return error("Verification is busy. Try again in a minute.", 429);
                    challenges++;
                    return json(await upstream((connection) => verifyTotp(connection, serial, code)));
                }
                for (const [token, until] of challenged) {
                    if (until <= now) challenged.delete(token);
                }
                if (challenges >= 30 || challenged.has(serial))
                    return error("Wait before sending another challenge.", 429);
                challenges++;
                challenged.set(serial, now + 30_000);
                if (passkeyAction === "challenge" && passkeyAccount) {
                    const challenge = await upstream((connection) =>
                        triggerPasskeyChallenge(connection, config.origin, passkeyAccount, serial),
                    );
                    passkeyChallenges.set(serial, {id: challenge.id, expiresAt: Date.now() + 120_000});
                    return json(challenge);
                }
                if (match?.[2] === "indexed-challenge") {
                    const challenge = await upstream((connection) => triggerIndexedChallenge(connection, serial));
                    indexedChallenges.set(serial, {id: challenge.id, length: challenge.positions.length});
                    return json(challenge);
                }
                return json(await upstream((connection) => triggerChallenge(connection, serial)));
            }
            if (enrollments >= 10) return error("Enrollment is busy. Try again in a minute.", 429);
            const prefix = passkey
                ? "WAN"
                : enrollmentType === "indexedsecret"
                  ? "PIIX"
                  : enrollmentType === "totp"
                    ? "TOTP"
                    : "EDUPT";
            const newSerial = prefix + randomBytes(12).toString("hex").toUpperCase();
            const expiresAt = Math.floor((now + config.tokenLifetimeMs) / 60_000) * 60_000;
            if (!inventory.reserve({serial: newSerial, description, expiresAt}, config.maxTokens)) {
                return error(
                    "Test token capacity reached. Each browser can keep up to three tokens. Remove a token or try again later.",
                    429,
                );
            }
            enrollments++;
            if (passkey && passkeyAccount) {
                const registration = await upstream((connection) =>
                    startPasskey(connection, config.origin, passkeyAccount, description, newSerial, expiresAt),
                );
                passkeyTransactions.set(newSerial, registration.transaction_id);
                return json(registration, 201);
            }
            // Retain the reservation if eduMFA might have enrolled the token before a failure.
            if (enrollmentType === "indexedsecret") {
                return json(
                    await upstream((connection) => enrollIndexedSecret(connection, description, newSerial, expiresAt)),
                    201,
                );
            }
            return json(
                await upstream((connection) =>
                    enrollToken(
                        connection,
                        description,
                        newSerial,
                        expiresAt,
                        enrollmentType === "totp" ? "totp" : "push",
                    ),
                ),
                201,
            );
        } catch (cause) {
            // The upstream response can contain sensitive instance details.
            console.error(
                "Token tester upstream request failed:",
                cause instanceof Error ? cause.name : "Unknown error",
            );
            return error(
                "The test instance could not complete the request. Try again or contact the site operator.",
                502,
            );
        } finally {
            traffic.release();
            if (write) writing.delete(description);
        }
    }

    return {initialize, cleanup, handle};
}
