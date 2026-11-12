import {createHash, randomBytes} from "node:crypto";
import {
    eduMfaSession,
    enrollToken,
    listTesterInventory,
    listTokens,
    readChallenge,
    removeToken,
    testerDescriptionPrefix,
    triggerChallenge,
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
};

export function createTesterService(config: Config) {
    const upstream = eduMfaSession(config.instanceUrl, config.username, config.password, config.realm);
    const inventory = openInventory(config.databasePath);
    const traffic = createTrafficLimits();
    const writing = new Set<string>();
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
                } catch {
                    inventory.retry(token, Date.now() + 300_000);
                    console.error("Could not clean up an expired Push tester token. Cleanup will retry.");
                } finally {
                    writing.delete(description);
                }
            }
        } finally {
            cleaning = false;
        }
    }

    async function handle(request: Request, address: string) {
        if (request.headers.get("Origin") !== config.origin) return new Response(null, {status: 403});
        if (request.method === "OPTIONS") return new Response(null, {status: 204, headers});

        const key = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get("Authorization") ?? "")?.[1];
        if (!key) return error("A tester browser key is required.", 401);
        const owner = createHash("sha256").update(key).digest("hex").slice(0, 32);
        const description = testerDescriptionPrefix + owner;

        const url = new URL(request.url);
        const {method} = request;
        const list = url.pathname === "/tokens";
        const match = /^\/tokens\/([\w-]{1,128})(\/challenge)?$/.exec(url.pathname);
        const serial = match?.[1];
        const challenge = !!match?.[2];
        const id = url.searchParams.get("id");
        if (!(
            (list && (method === "GET" || method === "POST")) ||
            (serial &&
                (challenge
                    ? method === "POST" || (method === "GET" && id && /^[\w-]{1,128}$/.test(id))
                    : method === "DELETE"))
        )) {
            return error("Tester action not found.", 404);
        }

        const write = method !== "GET";
        if (write && writing.has(description)) return error("Wait for the current token action to finish.", 409);
        if (!traffic.admit(address, list && method === "POST", Date.now())) {
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
                    return json(null);
                }
                if (id && method === "GET")
                    return json(await upstream((connection) => readChallenge(connection, serial, id)));
                if (!token.enrolled || !token.active) return error("The test token is not active and enrolled.", 409);
            }

            const now = Date.now();
            const currentMinute = Math.floor(now / 60_000);
            if (minute !== currentMinute) {
                minute = currentMinute;
                enrollments = 0;
                challenges = 0;
            }
            if (serial) {
                for (const [token, until] of challenged) {
                    if (until <= now) challenged.delete(token);
                }
                if (challenges >= 30 || challenged.has(serial))
                    return error("Wait before sending another challenge.", 429);
                challenges++;
                challenged.set(serial, now + 30_000);
                return json(await upstream((connection) => triggerChallenge(connection, serial)));
            }
            if (enrollments >= 10) return error("Enrollment is busy. Try again in a minute.", 429);
            const newSerial = "EDUPT" + randomBytes(12).toString("hex").toUpperCase();
            const expiresAt = Math.floor((now + config.tokenLifetimeMs) / 60_000) * 60_000;
            if (!inventory.reserve({serial: newSerial, description, expiresAt}, config.maxTokens)) {
                return error(
                    "Test token capacity reached. Each browser can keep up to three tokens. Remove a token or try again later.",
                    429,
                );
            }
            enrollments++;
            // Retain the reservation if eduMFA might have enrolled the token before a failure.
            return json(
                await upstream((connection) => enrollToken(connection, description, newSerial, expiresAt)),
                201,
            );
        } catch (cause) {
            // The upstream response can contain sensitive instance details.
            console.error(
                "Push tester upstream request failed:",
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
