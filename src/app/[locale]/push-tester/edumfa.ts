export type PushToken = {
    serial: string;
    enrolled: boolean;
    active: boolean;
    type?: "push" | "passkey" | "totp" | "indexedsecret";
};
export type ChallengeStatus = "pending" | "accepted" | "declined" | "expired";
export type Enrollment = {serial: string; image: string};
export type IndexedEnrollment = {serial: string; secret: string};
export type IndexedChallenge = {id: string; positions: number[]};
export type Connection = {url: string; key: string};
type CredentialDescriptor = Omit<PublicKeyCredentialDescriptor, "id"> & {id: string};
export type PasskeyChallenge = {
    id: string;
    options: Omit<PublicKeyCredentialRequestOptions, "challenge" | "allowCredentials"> & {
        challenge: string;
        allowCredentials: CredentialDescriptor[];
    };
};
export type PasskeyRegistration = {
    transaction_id: string;
    serialNumber: string;
    nonce: string;
    relyingParty: PublicKeyCredentialRpEntity;
    name: string;
    displayName: string;
    pubKeyCredAlgorithms: PublicKeyCredentialParameters[];
    authenticatorSelection: AuthenticatorSelectionCriteria;
    timeout?: number;
    attestation?: AttestationConveyancePreference;
    excludeCredentials?: CredentialDescriptor[];
    authenticatorSelectionList?: string[];
};

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

async function request<T>(
    connection: Connection,
    path: string,
    method = "GET",
    signal?: AbortSignal,
    body?: URLSearchParams,
): Promise<T> {
    let response: Response;
    try {
        const timeout = AbortSignal.timeout(20_000);
        response = await fetch(connection.url + path, {
            method,
            body,
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

export function enrollToken(connection: Connection, type: "push" | "totp") {
    return request<Enrollment>(connection, `/tokens?type=${type}`, "POST");
}

export function enrollIndexedSecret(connection: Connection) {
    return request<IndexedEnrollment>(connection, "/tokens?type=indexedsecret", "POST");
}

export function triggerIndexedChallenge(connection: Connection, serial: string) {
    return request<IndexedChallenge>(connection, `/tokens/${encodeURIComponent(serial)}/indexed-challenge`, "POST");
}

export function verifyIndexedSecret(connection: Connection, serial: string, id: string, answer: string) {
    return request<Exclude<ChallengeStatus, "pending">>(
        connection,
        `/tokens/${encodeURIComponent(serial)}/indexed-response`,
        "POST",
        undefined,
        new URLSearchParams({transaction_id: id, answer}),
    );
}

export function verifyTotp(connection: Connection, serial: string, code: string) {
    return request<boolean>(
        connection,
        `/tokens/${encodeURIComponent(serial)}/otp`,
        "POST",
        undefined,
        new URLSearchParams({code}),
    );
}

export function startPasskey(connection: Connection) {
    return request<PasskeyRegistration>(connection, "/passkeys", "POST");
}

export async function verifyPasskey(connection: Connection, serial: string): Promise<boolean> {
    const path = `/passkeys/${encodeURIComponent(serial)}`;
    const {id, options} = await request<PasskeyChallenge>(connection, path + "/challenge", "POST");
    const signal = AbortSignal.timeout(options.timeout || 60_000);
    const credential = await navigator.credentials.get({
        signal,
        publicKey: {
            ...options,
            challenge: decodeBase64Url(options.challenge),
            allowCredentials: options.allowCredentials.map(({id, ...descriptor}) => ({
                ...descriptor,
                id: decodeBase64Url(id),
            })),
        },
    });
    if (
        !(credential instanceof PublicKeyCredential) ||
        !(credential.response instanceof AuthenticatorAssertionResponse)
    ) {
        throw new Error("The browser did not return a passkey assertion.");
    }
    signal.throwIfAborted();
    const {clientDataJSON, authenticatorData, signature} = credential.response;
    return request<boolean>(
        connection,
        path + "/assertion",
        "POST",
        undefined,
        new URLSearchParams({
            transaction_id: id,
            credentialid: encodeBase64Url(new Uint8Array(credential.rawId)),
            clientdata: encodeBase64Url(new Uint8Array(clientDataJSON)),
            authenticatordata: encodeBase64Url(new Uint8Array(authenticatorData)),
            signaturedata: encodeBase64Url(new Uint8Array(signature)),
        }),
    );
}

function decodeBase64Url(value: string) {
    return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (character) =>
        character.charCodeAt(0),
    );
}

function encodeBase64Url(value: Uint8Array) {
    return btoa(Array.from(value, (byte) => String.fromCharCode(byte)).join(""))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "");
}

export async function registerPasskey(
    connection: Connection,
    registration: PasskeyRegistration,
    signal: AbortSignal,
    onCredentialCreated: () => void,
) {
    const extensions: AuthenticationExtensionsClientInputs & {authnSel?: string[]} = {
        credProps: true,
        authnSel: registration.authenticatorSelectionList,
    };
    const credential = await navigator.credentials.create({
        signal,
        publicKey: {
            challenge: decodeBase64Url(registration.nonce),
            rp: registration.relyingParty,
            user: {
                id: new TextEncoder().encode(registration.serialNumber),
                name: registration.name,
                displayName: registration.displayName,
            },
            pubKeyCredParams: registration.pubKeyCredAlgorithms,
            authenticatorSelection: {...registration.authenticatorSelection, requireResidentKey: true},
            timeout: registration.timeout,
            attestation: registration.attestation ?? "direct",
            excludeCredentials: registration.excludeCredentials?.map(({id, ...descriptor}) => ({
                ...descriptor,
                id: decodeBase64Url(id),
            })),
            extensions,
        },
    });
    if (
        !(credential instanceof PublicKeyCredential) ||
        !(credential.response instanceof AuthenticatorAttestationResponse)
    ) {
        throw new Error("The browser did not return a passkey.");
    }
    const extensionResults: AuthenticationExtensionsClientOutputs & {authnSel?: boolean} =
        credential.getClientExtensionResults();
    if (extensions.authnSel?.length && extensionResults.authnSel !== true) {
        throw new Error("This authenticator does not meet the tester's enrollment policy.");
    }
    signal.throwIfAborted();
    const fields = new URLSearchParams({
        transaction_id: registration.transaction_id,
        clientdata: encodeBase64Url(new Uint8Array(credential.response.clientDataJSON)),
        regdata: encodeBase64Url(new Uint8Array(credential.response.attestationObject)),
        registrationclientextensions: encodeBase64Url(new TextEncoder().encode(JSON.stringify(extensionResults))),
    });
    onCredentialCreated();
    return request<PushToken>(
        connection,
        `/passkeys/${encodeURIComponent(registration.serialNumber)}`,
        "POST",
        undefined,
        fields,
    );
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
