import {createServer} from "node:http";
import {isIP} from "node:net";
import {createTesterService} from "./service.ts";

const {EDUMFA_TEST_URL, EDUMFA_TEST_USERNAME, EDUMFA_TEST_PASSWORD, EDUMFA_TEST_REALM, PUSH_TESTER_ORIGIN} =
    process.env;
if (!EDUMFA_TEST_URL || !EDUMFA_TEST_USERNAME || !EDUMFA_TEST_PASSWORD || !PUSH_TESTER_ORIGIN) {
    throw new Error("Set EDUMFA_TEST_URL, EDUMFA_TEST_USERNAME, EDUMFA_TEST_PASSWORD and PUSH_TESTER_ORIGIN.");
}

const instance = new URL(EDUMFA_TEST_URL);
if (
    !["http:", "https:"].includes(instance.protocol) ||
    instance.username ||
    instance.password ||
    instance.search ||
    instance.hash
) {
    throw new Error("EDUMFA_TEST_URL must be an HTTP or HTTPS base URL.");
}
function positiveInteger(name: string, fallback: number, maximum: number) {
    const value = Number(process.env[name] ?? fallback);
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
        throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
    }
    return value;
}

const {initialize, cleanup, handle} = createTesterService({
    origin: new URL(PUSH_TESTER_ORIGIN).origin,
    instanceUrl: instance.href.replace(/\/+$/, ""),
    username: EDUMFA_TEST_USERNAME,
    password: EDUMFA_TEST_PASSWORD,
    realm: EDUMFA_TEST_REALM,
    databasePath: process.env.PUSH_TESTER_DB_PATH ?? ".push-tester.sqlite",
    maxTokens: positiveInteger("PUSH_TESTER_MAX_TOKENS", 100, 10_000),
    tokenLifetimeMs: positiveInteger("PUSH_TESTER_TOKEN_TTL_HOURS", 24, 720) * 3_600_000,
});
const port = positiveInteger("PUSH_TESTER_PORT", 8787, 65535);
const host = process.env.PUSH_TESTER_HOST ?? "127.0.0.1";
const trustProxy = process.env.PUSH_TESTER_TRUST_PROXY === "1";
if (trustProxy && host !== "127.0.0.1" && host !== "::1") {
    throw new Error("PUSH_TESTER_TRUST_PROXY requires a loopback listener.");
}

try {
    await initialize();
} catch {
    throw new Error("Could not inventory the eduMFA test tokens. Check the instance and service account permissions.");
}

function runCleanup() {
    void cleanup().catch(() => console.error("Push tester cleanup failed. Cleanup will retry."));
}

createServer(async (incoming, outgoing) => {
    incoming.resume();
    try {
        const request = new Request(new URL(incoming.url ?? "/", "http://localhost"), {
            method: incoming.method,
            headers: {
                Origin: incoming.headers.origin ?? "",
                Authorization: incoming.headers.authorization ?? "",
            },
        });
        const forwarded = incoming.headers["x-real-ip"];
        const address =
            trustProxy && typeof forwarded === "string" && isIP(forwarded)
                ? forwarded
                : (incoming.socket.remoteAddress ?? "unknown");
        const response = await handle(request, address.replace(/^::ffff:/i, ""));
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(await response.text());
    } catch {
        outgoing.writeHead(400, {"Cache-Control": "no-store"});
        outgoing.end();
    }
}).listen(port, host, () => {
    console.log(`Push token tester service listening on port ${port}`);
    runCleanup();
    setInterval(runCleanup, 60_000).unref();
});
