import {randomInt} from "node:crypto";
import type {
    ChallengeStatus,
    IndexedChallenge,
    IndexedEnrollment,
    PasskeyChallenge,
    PasskeyRegistration,
    PushToken,
} from "../../src/app/push-tester/edumfa.ts";

const tokenType = "edupush";
const testerTokenTypes = {edupush: "push", webauthn: "passkey", totp: "totp", indexedsecret: "indexedsecret"} as const;
const matrixSize = 81;
const matrixAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export const testerDescriptionPrefix = "eduMFA Web Push Tester ";
const testerDescription = /^eduMFA Web Push Tester [a-f0-9]{32}$/;

type JsonObject = Record<string, unknown>;
type Connection = {url: string; token?: string};

function object(value: unknown): JsonObject | undefined {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return value as JsonObject;
    }
}

async function request(connection: Connection, path: string, options: RequestInit = {}) {
    const response = await fetch(connection.url + path, {
        ...options,
        headers: {...options.headers, ...(connection.token ? {Authorization: connection.token} : {})},
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(7000),
    });

    const body = object(await response.json().catch(() => null));
    const result = object(body?.result);
    if (!response.ok || result?.status !== true) {
        const error = object(result?.error)?.message;
        throw new UpstreamError(
            response.status,
            typeof error === "string" ? error : `eduMFA returned an unexpected response (HTTP ${response.status}).`,
        );
    }

    return {value: result.value, detail: object(body?.detail), time: body?.time};
}

async function queryTokens(
    connection: Connection,
    description: string,
    serial?: string,
): Promise<(PushToken & {description: string})[]> {
    const query = new URLSearchParams({description, page: "1", pagesize: "50"});
    if (serial) query.set("serial", serial);
    const tokens: (PushToken & {description: string})[] = [];

    for (;;) {
        const {value} = await request(connection, `/token/?${query}`);
        const page = object(value);
        if (!Array.isArray(page?.tokens)) {
            throw new Error("eduMFA did not return a token list.");
        }
        for (const entry of page.tokens) {
            const token = object(entry);
            const kind = token?.tokentype;
            if (
                token &&
                typeof kind === "string" &&
                Object.hasOwn(testerTokenTypes, kind) &&
                typeof token.description === "string" &&
                testerDescription.test(token.description) &&
                typeof token.serial === "string" &&
                /^[\w-]{1,128}$/.test(token.serial)
            ) {
                tokens.push({
                    serial: token.serial,
                    description: token.description,
                    type: testerTokenTypes[kind as keyof typeof testerTokenTypes],
                    enrolled: token.rollout_state === (kind === tokenType ? "enrolled" : ""),
                    active: token.active === true,
                });
            }
        }
        if (page.next === null || page.next === undefined) {
            return tokens;
        }
        if (
            typeof page.next !== "number" ||
            !Number.isSafeInteger(page.next) ||
            page.next <= Number(query.get("page"))
        ) {
            throw new Error("eduMFA returned an invalid token list page.");
        }
        query.set("page", String(page.next));
    }
}

export async function listTokens(connection: Connection, description: string, serial?: string): Promise<PushToken[]> {
    const tokens = await queryTokens(connection, description, serial);
    return tokens
        .filter((token) => token.description === description)
        .map(({serial, enrolled, active, type}) => ({serial, enrolled, active, type}));
}

export type PasskeyAccount = {user: string; realm: string};

export async function startPasskey(
    connection: Connection,
    origin: string,
    account: PasskeyAccount,
    description: string,
    serial: string,
    expiresAt: number,
) {
    const {value, detail} = await request(connection, "/token/init", {
        method: "POST",
        headers: {Origin: origin},
        body: new URLSearchParams({
            ...account,
            type: "webauthn",
            description,
            serial,
            validity_period_end: new Date(expiresAt).toISOString().slice(0, 16) + "+0000",
        }),
    });
    const registration = object(detail?.webAuthnRegisterRequest);
    if (
        value !== true ||
        detail?.serial !== serial ||
        registration?.serialNumber !== serial ||
        typeof registration.nonce !== "string" ||
        typeof registration.transaction_id !== "string" ||
        object(registration.relyingParty)?.id !== new URL(origin).hostname ||
        object(registration.authenticatorSelection)?.residentKey !== "required" ||
        !Array.isArray(registration.pubKeyCredAlgorithms)
    ) {
        throw new Error("eduMFA did not return compatible passkey registration options.");
    }
    return registration as PasskeyRegistration;
}

export async function finishPasskey(
    connection: Connection,
    origin: string,
    account: PasskeyAccount,
    serial: string,
    fields: URLSearchParams,
) {
    for (const [key, value] of Object.entries({...account, type: "webauthn", serial})) fields.set(key, value);
    const {value, detail} = await request(connection, "/token/init", {
        method: "POST",
        headers: {Origin: origin},
        body: fields,
    });
    if (value !== true || !object(detail?.webAuthnRegisterResponse)) {
        throw new Error("eduMFA did not confirm passkey registration.");
    }
}

export function listTesterInventory(connection: Connection) {
    return queryTokens(connection, testerDescriptionPrefix + "*");
}

export async function enrollToken(
    connection: Connection,
    description: string,
    serial: string,
    expiresAt: number,
    type: "push" | "totp" = "push",
) {
    const {value, detail} = await request(connection, "/token/init", {
        method: "POST",
        body: new URLSearchParams({
            type: type === "totp" ? "totp" : tokenType,
            genkey: "1",
            description,
            serial,
            tokenissuer: "eduMFA Push Tester",
            ...(type === "totp" ? {otplen: "6", tokenlabel: "<s>"} : {}),
            validity_period_end: new Date(expiresAt).toISOString().slice(0, 16) + "+0000",
        }),
    });
    const image = object(type === "totp" ? detail?.googleurl : detail?.pushurl)?.img;
    if (
        value !== true ||
        detail?.serial !== serial ||
        typeof image !== "string" ||
        !/^data:image\/png;base64,[\w+/=]+$/.test(image)
    ) {
        throw new Error(
            "eduMFA did not return an enrollment QR code. Refresh the list to check whether it created a token.",
        );
    }
    return {serial, image};
}

export async function verifyTotp(connection: Connection, serial: string, code: string): Promise<boolean> {
    const {value} = await request(connection, "/validate/check", {
        method: "POST",
        body: new URLSearchParams({serial, pass: code}),
    });
    if (typeof value !== "boolean") throw new Error("eduMFA did not return a TOTP verification result.");
    return value;
}

export async function enrollIndexedSecret(
    connection: Connection,
    description: string,
    serial: string,
    expiresAt: number,
): Promise<IndexedEnrollment> {
    const secret = Array.from({length: matrixSize}, () => matrixAlphabet[randomInt(matrixAlphabet.length)]).join("");
    const {value, detail} = await request(connection, "/token/init", {
        method: "POST",
        body: new URLSearchParams({
            type: "indexedsecret",
            otpkey: secret,
            serial,
            description,
            validity_period_end: new Date(expiresAt).toISOString().slice(0, 16) + "+0000",
        }),
    });
    if (value !== true || detail?.serial !== serial) {
        throw new Error("eduMFA did not confirm Indexed Secret enrollment.");
    }
    return {serial, secret};
}

export async function triggerIndexedChallenge(connection: Connection, serial: string): Promise<IndexedChallenge> {
    const {value, detail} = await request(connection, "/validate/triggerchallenge", {
        method: "POST",
        body: new URLSearchParams({serial, type: "indexedsecret"}),
    });
    const id = detail?.transaction_id;
    const positions = object(detail?.attributes)?.random_positions;
    if (
        value !== 1 ||
        typeof id !== "string" ||
        !/^[\w-]{1,128}$/.test(id) ||
        !Array.isArray(positions) ||
        positions.length !== 6 ||
        !positions.every(
            (p: unknown): p is number => typeof p === "number" && Number.isInteger(p) && p >= 1 && p <= matrixSize,
        )
    ) {
        throw new Error("eduMFA did not return a valid Indexed Secret challenge.");
    }
    return {id, positions};
}

export async function verifyIndexedSecret(connection: Connection, serial: string, id: string, answer: string) {
    if ((await readChallenge(connection, serial, id)) === "expired") return "expired";
    const {value} = await request(connection, "/validate/check", {
        method: "POST",
        body: new URLSearchParams({serial, transaction_id: id, pass: answer}),
    });
    if (typeof value !== "boolean") throw new Error("eduMFA did not return an Indexed Secret verification result.");
    return value ? "accepted" : "declined";
}

export async function removeToken(connection: Connection, serial: string) {
    const {value} = await request(connection, `/token/${encodeURIComponent(serial)}`, {method: "DELETE"});
    if (value !== 0 && value !== 1) {
        throw new Error("eduMFA did not remove the token. Refresh the list to check whether it still exists.");
    }
}

export async function triggerChallenge(connection: Connection, serial: string) {
    const {value, detail} = await request(connection, "/validate/triggerchallenge", {
        method: "POST",
        body: new URLSearchParams({serial, type: tokenType, exception: "1"}),
    });
    const id = detail?.transaction_id;
    if (value !== 1 || typeof id !== "string" || !id) {
        throw new Error("eduMFA did not create a challenge for this token.");
    }
    return id;
}

export async function triggerPasskeyChallenge(
    connection: Connection,
    origin: string,
    account: PasskeyAccount,
    serial: string,
): Promise<PasskeyChallenge> {
    const {value, detail} = await request(connection, "/validate/triggerchallenge", {
        method: "POST",
        headers: {Origin: origin},
        body: new URLSearchParams({...account, serial, type: "webauthn"}),
    });
    const attributes = object(detail?.attributes);
    const options = object(attributes?.webAuthnSignRequest);
    const id = detail?.transaction_id;
    if (
        value !== 1 ||
        typeof id !== "string" ||
        !id ||
        typeof options?.challenge !== "string" ||
        options.rpId !== new URL(origin).hostname ||
        !Array.isArray(options.allowCredentials) ||
        options.allowCredentials.length !== 1
    ) {
        throw new Error("eduMFA did not return a challenge scoped to the selected passkey.");
    }
    return {id, options: options as PasskeyChallenge["options"]};
}

export async function verifyPasskeyChallenge(
    connection: Connection,
    origin: string,
    account: PasskeyAccount,
    serial: string,
    fields: URLSearchParams,
): Promise<boolean> {
    for (const [key, value] of Object.entries({...account, type: "webauthn", serial, pass: ""})) fields.set(key, value);
    const {value} = await request(connection, "/validate/check", {
        method: "POST",
        headers: {Origin: origin},
        body: fields,
    });
    if (typeof value !== "boolean") throw new Error("eduMFA did not return a verification result.");
    return value;
}

export async function readChallenge(connection: Connection, serial: string, id: string): Promise<ChallengeStatus> {
    const query = new URLSearchParams({transaction_id: id});
    const {value, time} = await request(connection, `/token/challenges/${encodeURIComponent(serial)}?${query}`);
    const challenges = object(value)?.challenges;
    if (!Array.isArray(challenges)) {
        throw new Error("eduMFA did not return a challenge list.");
    }

    const challenge = challenges.map(object).find((entry) => entry?.transaction_id === id && entry.serial === serial);
    // eduMFA can delete expired challenges during cleanup.
    if (!challenge) return "expired";
    if (challenge.otp_valid === true) return "accepted";
    if (challenge.data === "challenge_declined") return "declined";

    const expires = typeof challenge.expiration === "string" ? Date.parse(challenge.expiration) : NaN;
    if (!Number.isFinite(expires) || typeof time !== "number") {
        throw new Error("eduMFA did not return a valid challenge expiration.");
    }
    return time * 1000 >= expires ? "expired" : "pending";
}

class UpstreamError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export function eduMfaSession(url: string, username: string, password: string, realm?: string) {
    let session: Promise<Connection> | undefined;

    async function signIn() {
        const body = new URLSearchParams({username, password});
        if (realm) body.set("realm", realm);
        const {value} = await request({url}, "/auth", {method: "POST", body});
        const result = object(value);
        if (typeof result?.token !== "string" || result.role !== "admin") {
            throw new Error("eduMFA did not issue an administrator session.");
        }
        return {url, token: result.token};
    }

    function getSession() {
        session ??= signIn().catch((error: unknown) => {
            session = undefined;
            throw error;
        });
        return session;
    }

    return async <T>(action: (connection: Connection) => Promise<T>): Promise<T> => {
        const current = getSession();
        const connection = await current;
        try {
            return await action(connection);
        } catch (error) {
            if (!(error instanceof UpstreamError) || error.status !== 401) {
                throw error;
            }
            if (session === current) session = undefined;
            return action(await getSession());
        }
    };
}
