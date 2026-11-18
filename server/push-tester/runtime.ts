import {createTesterService} from "./service";

function positiveInteger(name: string, fallback: number, maximum: number) {
    const value = Number(process.env[name] ?? fallback);
    if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
        throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
    }
    return value;
}

export function testerConfigured() {
    return !!(
        process.env.EDUMFA_TEST_URL &&
        process.env.EDUMFA_TEST_USERNAME &&
        process.env.EDUMFA_TEST_PASSWORD &&
        process.env.PUSH_TESTER_ORIGIN
    );
}

function createRuntime() {
    if (!testerConfigured()) throw new Error("Configure the eduMFA test instance and PUSH_TESTER_ORIGIN.");
    const instance = new URL(process.env.EDUMFA_TEST_URL!);
    const origin = new URL(process.env.PUSH_TESTER_ORIGIN!);
    if (
        !["http:", "https:"].includes(instance.protocol) ||
        instance.username ||
        instance.password ||
        instance.search ||
        instance.hash ||
        !["http:", "https:"].includes(origin.protocol)
    ) {
        throw new Error("Configure valid HTTP or HTTPS URLs for the tester.");
    }
    const user = process.env.EDUMFA_PASSKEY_TEST_USER?.trim();
    const realm = process.env.EDUMFA_PASSKEY_TEST_REALM?.trim();
    if (!!user !== !!realm) throw new Error("Set both passkey test user and realm.");
    const service = createTesterService({
        origin: origin.origin,
        instanceUrl: instance.href.replace(/\/+$/, ""),
        username: process.env.EDUMFA_TEST_USERNAME!,
        password: process.env.EDUMFA_TEST_PASSWORD!,
        realm: process.env.EDUMFA_TEST_REALM,
        databasePath: process.env.PUSH_TESTER_DB_PATH ?? ".push-tester.sqlite",
        maxTokens: positiveInteger("PUSH_TESTER_MAX_TOKENS", 100, 10_000),
        tokenLifetimeMs: positiveInteger("PUSH_TESTER_TOKEN_TTL_HOURS", 24, 720) * 3_600_000,
        passkeyAccount: user && realm ? {user, realm} : undefined,
    });
    let initialization: Promise<void> | undefined;
    async function ready() {
        initialization ??= service.initialize().catch((error: unknown) => {
            initialization = undefined;
            throw error;
        });
        await initialization;
        return service;
    }
    async function cleanup() {
        try {
            await ready();
            await service.cleanup();
        } catch {
            console.error("Token tester initialization or cleanup failed. It will retry.");
        }
    }
    void cleanup();
    setInterval(() => void cleanup(), 60_000).unref();
    return {ready};
}

const shared = globalThis as typeof globalThis & {tokenTester?: ReturnType<typeof createRuntime>};

export async function getTesterService() {
    shared.tokenTester ??= createRuntime();
    return shared.tokenTester.ready();
}
