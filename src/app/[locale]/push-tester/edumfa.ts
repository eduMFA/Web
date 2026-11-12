export type PushToken = {serial: string; enrolled: boolean; active: boolean};
export type ChallengeStatus = "pending" | "accepted" | "declined" | "expired";
export type Enrollment = {serial: string; image: string};
export type Connection = {url: string; key: string};

export function connect(url: string): Connection {
    const storageKey = "edumfa-push-tester-browser-key";
    let key = localStorage.getItem(storageKey);
    if (!key || !/^[a-f0-9]{64}$/.test(key)) {
        key = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join(
            "",
        );
        localStorage.setItem(storageKey, key);
    }
    return {url: url.replace(/\/+$/, ""), key};
}

async function request<T>(connection: Connection, path: string, method = "GET", signal?: AbortSignal): Promise<T> {
    let response: Response;
    try {
        const timeout = AbortSignal.timeout(20_000);
        response = await fetch(connection.url + path, {
            method,
            signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
            headers: {Authorization: `Bearer ${connection.key}`},
            cache: "no-store",
            credentials: "omit",
            redirect: "error",
        });
    } catch {
        throw new Error("Could not reach the Push token tester service.");
    }
    const result: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
        const error = result && typeof result === "object" && "error" in result && result.error;
        throw new Error(typeof error === "string" ? error : "The Push token tester request failed.");
    }
    if (result === undefined) throw new Error("The Push token tester returned an invalid response.");
    return result as T;
}

export function listTokens(connection: Connection, signal?: AbortSignal) {
    return request<PushToken[]>(connection, "/tokens", "GET", signal);
}

export function enrollToken(connection: Connection) {
    return request<Enrollment>(connection, "/tokens", "POST");
}

export function removeToken(connection: Connection, serial: string) {
    return request<null>(connection, `/tokens/${encodeURIComponent(serial)}`, "DELETE");
}

export function triggerChallenge(connection: Connection, serial: string) {
    return request<string>(connection, `/tokens/${encodeURIComponent(serial)}/challenge`, "POST");
}

export function readChallenge(connection: Connection, serial: string, id: string, signal?: AbortSignal) {
    const query = new URLSearchParams({id});
    return request<ChallengeStatus>(
        connection,
        `/tokens/${encodeURIComponent(serial)}/challenge?${query}`,
        "GET",
        signal,
    );
}
