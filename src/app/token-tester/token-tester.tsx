"use client";

import {useEffect, useRef, useState, type FormEvent} from "react";
import Image from "next/image";
import {Button} from "@heroui/react";
import {Trans, useLingui} from "@lingui/react/macro";
import {Footer} from "@/components/Footer";
import {NavigationBar} from "@/components/NavigationBar";
import {
    connect,
    enrollIndexedSecret,
    enrollToken,
    listTokens,
    readChallenge,
    registerPasskey,
    removeToken,
    startPasskey,
    triggerChallenge,
    triggerIndexedChallenge,
    verifyIndexedSecret,
    verifyPasskey,
    verifyTotp,
    type Connection,
    type ChallengeStatus,
    type IndexedChallenge,
    type IndexedEnrollment,
    type TestToken,
} from "./edumfa";
import {createMatrixPdf, matrixColumns, matrixCoordinate, matrixRows} from "./indexed-secret";

const results = {
    pending: {label: <Trans>Waiting for a response…</Trans>, color: "bg-blue-100 text-blue-900"},
    accepted: {label: <Trans>Challenge accepted</Trans>, color: "bg-green-100 text-green-900", icon: "✓"},
    declined: {label: <Trans>Challenge declined</Trans>, color: "bg-red-100 text-red-900", icon: "×"},
    expired: {label: <Trans>Challenge expired</Trans>, color: "bg-amber-100 text-amber-900"},
    paused: {label: <Trans>Status check paused</Trans>, color: "bg-gray-100 text-gray-900"},
};

const tokenNames = {
    push: <Trans>Push token</Trans>,
    passkey: <Trans>Passkey</Trans>,
    totp: <Trans>TOTP token</Trans>,
    indexedsecret: <Trans>Indexed Secret</Trans>,
};

type TokenType = keyof typeof tokenNames;
type TesterAction = TokenType | "refresh" | "load";

const enrollmentOptions = {
    push: {
        description: (
            <Trans>
                Push authentication sends a request to your phone for approval or rejection in eduMFA Authenticator.
            </Trans>
        ),
        action: <Trans>Enroll push token</Trans>,
    },
    totp: {
        description: (
            <Trans>
                TOTP generates short-lived, six-digit codes in an authenticator app, even when the device is offline.
            </Trans>
        ),
        action: <Trans>Enroll TOTP token</Trans>,
    },
    passkey: {
        description: (
            <Trans>
                A passkey uses a cryptographic key protected by your device or passkey manager. It is bound to the
                website to resist phishing.
            </Trans>
        ),
        action: <Trans>Enroll passkey</Trans>,
    },
    indexedsecret: {
        description: (
            <Trans>
                Indexed Secret uses a shared character grid. Each challenge requests six characters from randomly
                selected cells.
            </Trans>
        ),
        action: <Trans>Enroll Indexed Secret</Trans>,
    },
};

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

function focusHeading(heading: HTMLHeadingElement | null) {
    heading?.focus({preventScroll: true});
    heading?.scrollIntoView({block: "nearest"});
}

function IndexedSecretMatrix({enrollment, onClose}: {enrollment: IndexedEnrollment; onClose: () => void}) {
    const {t} = useLingui();
    const title = t`Indexed Secret matrix`;
    const [downloading, setDownloading] = useState(false);
    const [downloadFailed, setDownloadFailed] = useState(false);

    async function downloadMatrix() {
        setDownloading(true);
        setDownloadFailed(false);
        try {
            const bytes = await createMatrixPdf(enrollment, title);
            const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes)], {type: "application/pdf"}));
            const link = document.createElement("a");
            link.href = url;
            link.download = `indexed-secret-${enrollment.serial}.pdf`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            setDownloadFailed(true);
        } finally {
            setDownloading(false);
        }
    }

    return (
        <section className="rounded-xl border border-separator bg-surface p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2
                        className="scroll-mt-20 font-semibold"
                        id="indexed-secret-matrix"
                        ref={focusHeading}
                        tabIndex={-1}
                    >
                        {title}
                    </h2>
                    <p className="mt-1 font-mono text-sm break-all">{enrollment.serial}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onPress={downloadMatrix} isPending={downloading}>
                        <Trans>Download PDF</Trans>
                    </Button>
                    <Button variant="ghost" isDisabled={downloading} onPress={onClose}>
                        <Trans>Close matrix</Trans>
                    </Button>
                </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
                <Trans>Download a copy before closing this matrix. It’s only shown during enrollment.</Trans>
            </p>
            {downloadFailed && (
                <p className="mt-2 text-sm text-danger" role="alert">
                    <Trans>Could not download the matrix. Try again.</Trans>
                </p>
            )}
            <table className="mt-4 w-full max-w-xl table-fixed text-center" aria-labelledby="indexed-secret-matrix">
                <thead className="text-sm text-gray-600">
                    <tr>
                        <td className="w-6 sm:w-8" />
                        {matrixColumns.map((column) => (
                            <th key={column} scope="col" className="pb-1">
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {matrixRows.map((row, rowIndex) => (
                        <tr key={row} className="even:[&>td]:bg-gray-100">
                            <th scope="row" className="text-sm text-gray-600">
                                {row}
                            </th>
                            {matrixColumns.map((column) => (
                                <td
                                    key={column}
                                    className="relative h-8 border border-gray-300 pt-2 font-mono text-base leading-none font-bold sm:h-12 sm:text-xl"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="absolute top-0.5 left-0.5 text-[9px] leading-none font-medium text-gray-600 sm:top-1 sm:left-1 sm:text-xs"
                                    >
                                        {row}
                                        {column}
                                    </span>
                                    {enrollment.secret[rowIndex * matrixColumns.length + column - 1]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

function TokenRow({
    token,
    connection,
    onRemove,
}: {
    token: TestToken;
    connection: Connection;
    onRemove: (serial: string) => void;
}) {
    const {serial} = token;
    const {t} = useLingui();
    const passkey = token.type === "passkey";
    const totp = token.type === "totp";
    const indexed = token.type === "indexedsecret";
    const [indexedChallenge, setIndexedChallenge] = useState<IndexedChallenge>();
    const [code, setCode] = useState("");
    const [working, setWorking] = useState(false);
    const [transaction, setTransaction] = useState<string>();
    const [status, setStatus] = useState<ChallengeStatus>();
    const [error, setError] = useState("");
    const pending = status === "pending";
    const result = status && results[pending && error ? "paused" : status];
    const canVerify = token.enrolled && token.active;
    const codeLength = indexed ? indexedChallenge?.positions.length : 6;

    useEffect(() => {
        if (!transaction || !pending || error) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        async function poll(id: string) {
            try {
                const result = await readChallenge(connection, serial, id, controller.signal);
                if (controller.signal.aborted) return;
                setStatus(result);
                if (result === "pending") timer = setTimeout(() => void poll(id), 2000);
            } catch (error) {
                if (!controller.signal.aborted) setError(errorMessage(error));
            }
        }
        void poll(transaction);
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [connection, error, pending, serial, transaction]);

    async function challenge() {
        if (pending && !passkey) {
            setError("");
            return;
        }
        setWorking(true);
        setError("");
        try {
            if (passkey) {
                setStatus("pending");
                setStatus((await verifyPasskey(connection, serial)) ? "accepted" : "declined");
            } else if (indexed) {
                setIndexedChallenge(await triggerIndexedChallenge(connection, serial));
                setCode("");
                setStatus(undefined);
            } else {
                setTransaction(await triggerChallenge(connection, serial));
                setStatus("pending");
            }
        } catch (error) {
            if (passkey) {
                setStatus(undefined);
                setError(
                    error instanceof DOMException && ["NotAllowedError", "TimeoutError"].includes(error.name)
                        ? t`Passkey verification was canceled or timed out.`
                        : errorMessage(error),
                );
            } else {
                setError(errorMessage(error));
            }
        } finally {
            setWorking(false);
        }
    }

    async function remove() {
        setWorking(true);
        setError("");
        try {
            await removeToken(connection, serial);
            onRemove(serial);
        } catch (error) {
            setError(errorMessage(error));
            setWorking(false);
        }
    }

    async function submitCode(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (working || !canVerify || code.length !== codeLength) return;
        setWorking(true);
        setStatus(undefined);
        setError("");
        try {
            if (indexedChallenge) {
                setStatus(await verifyIndexedSecret(connection, serial, indexedChallenge.id, code));
                setIndexedChallenge(undefined);
            } else {
                setStatus((await verifyTotp(connection, serial, code)) ? "accepted" : "declined");
            }
            setCode("");
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setWorking(false);
        }
    }

    return (
        <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
                <h3 className="font-medium">{tokenNames[token.type ?? "push"]}</h3>
                <p className="font-mono text-xs break-all text-muted">{serial}</p>
                <p className="mt-1 text-sm text-muted" role="status">
                    {!token.enrolled ? (
                        <Trans>Awaiting enrollment</Trans>
                    ) : token.active ? (
                        <Trans>Enrolled</Trans>
                    ) : (
                        <Trans>Inactive</Trans>
                    )}
                </p>
                <div role="status">
                    {result && (
                        <span
                            className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${result.color}`}
                        >
                            {pending && !error && (
                                <span
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
                                />
                            )}
                            {"icon" in result && <span aria-hidden="true">{result.icon}</span>}
                            {totp && status === "accepted" ? (
                                <Trans>Code accepted</Trans>
                            ) : totp && status === "declined" ? (
                                <Trans>Code rejected</Trans>
                            ) : passkey && status === "accepted" ? (
                                <Trans>Passkey verified</Trans>
                            ) : (
                                result.label
                            )}
                        </span>
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-700" role="alert">
                        {error}
                    </p>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {indexedChallenge && (
                    <p
                        id={`positions-${serial}`}
                        className="w-full text-sm text-foreground sm:text-right"
                        role="status"
                    >
                        <Trans>Enter the six characters at these cells in order. Match uppercase and lowercase.</Trans>{" "}
                        <strong className="font-mono">
                            {indexedChallenge.positions.map(matrixCoordinate).join(", ")}
                        </strong>
                    </p>
                )}
                {totp || indexedChallenge ? (
                    <form className="flex flex-wrap items-center gap-2" onSubmit={submitCode}>
                        <input
                            aria-label={indexed ? t`Matrix characters` : t`Six-digit authenticator code`}
                            aria-describedby={indexed ? `positions-${serial}` : undefined}
                            autoComplete={indexed ? "off" : "one-time-code"}
                            autoCapitalize="off"
                            spellCheck={false}
                            inputMode={indexed ? "text" : "numeric"}
                            placeholder={indexed ? undefined : "000000"}
                            className={`rounded-lg border border-gray-300 px-3 py-2 font-mono ${indexed ? "w-40" : "w-28"}`}
                            value={code}
                            onChange={(event) =>
                                setCode(
                                    event.currentTarget.value
                                        .replace(indexed ? /[^A-Za-z0-9]/g : /[^0-9]/g, "")
                                        .slice(0, codeLength),
                                )
                            }
                            disabled={working || !canVerify}
                        />
                        <Button
                            type="submit"
                            variant="secondary"
                            isPending={working}
                            isDisabled={working || !canVerify || code.length !== codeLength}
                        >
                            {indexed ? <Trans>Verify response</Trans> : <Trans>Verify code</Trans>}
                        </Button>
                    </form>
                ) : passkey ? (
                    <Button
                        variant="secondary"
                        isDisabled={working || !token.enrolled || !token.active}
                        onPress={challenge}
                    >
                        <Trans>Verify passkey</Trans>
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        isDisabled={working || (pending ? !error : !token.enrolled || !token.active)}
                        onPress={challenge}
                    >
                        {pending && error ? (
                            <Trans>Retry status check</Trans>
                        ) : indexed ? (
                            <Trans>Request challenge</Trans>
                        ) : (
                            <Trans>Send challenge</Trans>
                        )}
                    </Button>
                )}
                <Button variant="danger-soft" isDisabled={working} onPress={remove}>
                    <Trans>Remove</Trans>
                </Button>
            </div>
        </li>
    );
}

function TokenList({serviceUrl, passkeysEnabled}: {serviceUrl: string; passkeysEnabled: boolean}) {
    const {t} = useLingui();
    const [connection, setConnection] = useState<Connection>();
    const [tokens, setTokens] = useState<TestToken[]>([]);
    const revision = useRef(0);
    const [qr, setQr] = useState<Awaited<ReturnType<typeof enrollToken>> & {type: "push" | "totp"}>();
    const [matrix, setMatrix] = useState<IndexedEnrollment>();
    const [passkeyPrompt, setPasskeyPrompt] = useState<AbortController>();
    const [verifyingPasskey, setVerifyingPasskey] = useState(false);
    const [actionInProgress, setActionInProgress] = useState<TesterAction | undefined>("load");
    const [error, setError] = useState("");
    const working = actionInProgress !== undefined;
    const visibleTypes: TokenType[] = passkeysEnabled
        ? ["push", "totp", "passkey", "indexedsecret"]
        : ["push", "totp", "indexedsecret"];

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            try {
                const connection = connect(serviceUrl);
                const tokens = await listTokens(connection, controller.signal);
                if (controller.signal.aborted) return;
                setConnection(connection);
                setTokens(tokens);
            } catch (error) {
                if (!controller.signal.aborted) setError(errorMessage(error));
            } finally {
                if (!controller.signal.aborted) setActionInProgress(undefined);
            }
        }
        void load();
        return () => controller.abort();
    }, [serviceUrl]);

    useEffect(() => {
        if (qr?.type !== "push" || !connection) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        async function poll(connection: Connection, serial: string) {
            try {
                const updated = await listTokens(connection, controller.signal);
                if (controller.signal.aborted) return;
                const token = updated.find((token) => token.serial === serial);
                setTokens((tokens) =>
                    token
                        ? tokens.map((current) => (current.serial === serial ? token : current))
                        : tokens.filter((current) => current.serial !== serial),
                );
                if (!token || token.enrolled) {
                    setQr(undefined);
                    return;
                }
            } catch {
                // A transient refresh failure should not discard the enrollment QR code.
            }
            if (!controller.signal.aborted) timer = setTimeout(() => void poll(connection, serial), 2500);
        }
        timer = setTimeout(() => void poll(connection, qr.serial), 2500);
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [connection, qr]);

    async function update(action: "refresh" | "push" | "totp" | "indexedsecret") {
        setActionInProgress(action);
        setError("");
        try {
            if (action === "refresh") {
                const currentConnection = connection ?? connect(serviceUrl);
                const startedAt = revision.current;
                const refreshed = await listTokens(currentConnection);
                setConnection(currentConnection);
                if (startedAt === revision.current) setTokens(refreshed);
                return;
            }
            if (!connection) return;
            if (action === "indexedsecret") {
                const enrollment = await enrollIndexedSecret(connection);
                setTokens((tokens) => [
                    {serial: enrollment.serial, type: action, enrolled: true, active: true},
                    ...tokens,
                ]);
                setMatrix(enrollment);
            } else {
                const enrollment = await enrollToken(connection, action);
                const ready = action === "totp";
                setTokens((tokens) => [
                    {serial: enrollment.serial, type: action, enrolled: ready, active: ready},
                    ...tokens,
                ]);
                setQr({...enrollment, type: action});
            }
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setActionInProgress(undefined);
        }
    }

    function removed(serial: string) {
        revision.current++;
        setTokens((tokens) => tokens.filter((token) => token.serial !== serial));
        setQr((qr) => (qr?.serial === serial ? undefined : qr));
        setMatrix((matrix) => (matrix?.serial === serial ? undefined : matrix));
    }

    async function enrollPasskey() {
        if (!connection) return;
        setActionInProgress("passkey");
        setError("");
        const prompt = new AbortController();
        let serial: string | undefined;
        let submitted = false;
        try {
            if (!window.isSecureContext || !window.PublicKeyCredential || !navigator.credentials) {
                throw new Error(t`Passkeys require a supported browser and a secure connection.`);
            }
            const registration = await startPasskey(connection);
            serial = registration.serialNumber;
            const signal = AbortSignal.any([prompt.signal, AbortSignal.timeout(registration.timeout || 60_000)]);
            setPasskeyPrompt(prompt);
            const enrolled = await registerPasskey(connection, registration, signal, () => {
                submitted = true;
                setPasskeyPrompt(undefined);
                setVerifyingPasskey(true);
            });
            setTokens((tokens) => [enrolled, ...tokens]);
            requestAnimationFrame(() => focusHeading(document.querySelector<HTMLHeadingElement>("#test-tokens")));
        } catch (error) {
            setPasskeyPrompt(undefined);
            const pendingSerial = serial;
            if (pendingSerial) {
                if (submitted) {
                    const startedAt = revision.current;
                    const refreshed = await listTokens(connection).catch(() => undefined);
                    if (refreshed && startedAt === revision.current) setTokens(refreshed);
                } else {
                    await removeToken(connection, pendingSerial).catch(() => {
                        setTokens((tokens) => [
                            {serial: pendingSerial, type: "passkey", enrolled: false, active: false},
                            ...tokens,
                        ]);
                    });
                }
            }
            if (!prompt.signal.aborted) {
                setError(
                    error instanceof DOMException && ["NotAllowedError", "TimeoutError"].includes(error.name)
                        ? t`Passkey creation was canceled or timed out. Try enrolling again.`
                        : errorMessage(error),
                );
            }
        } finally {
            setPasskeyPrompt(undefined);
            setVerifyingPasskey(false);
            setActionInProgress(undefined);
        }
    }

    function closeEnrollment(type: Exclude<TokenType, "passkey">) {
        if (type === "indexedsecret") setMatrix(undefined);
        else setQr(undefined);
        requestAnimationFrame(() => document.getElementById(`enroll-${type}`)?.focus());
    }

    return (
        <div className="space-y-6">
            <section aria-labelledby="enrollment-options">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-semibold" id="enrollment-options">
                        <Trans>Enroll a token</Trans>
                    </h2>
                    {tokens.length > 0 && (
                        <a className="text-sm text-accent underline sm:hidden" href="#test-tokens">
                            <Trans>Your test tokens</Trans>
                        </a>
                    )}
                </div>
                <ul
                    className={`grid gap-3 sm:grid-cols-2 lg:gap-4 ${passkeysEnabled ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
                >
                    {visibleTypes.map((type) => {
                        const {description, action} = enrollmentOptions[type];
                        const hasSetup =
                            type === "indexedsecret" ? !!matrix : (type === "push" || type === "totp") && !!qr;
                        return (
                            <li
                                key={type}
                                className="flex flex-col items-start gap-2 rounded-xl border border-separator bg-surface p-4 shadow-sm"
                            >
                                <h3 className="font-semibold">{tokenNames[type]}</h3>
                                <p className="grow text-sm leading-relaxed text-muted" id={`description-${type}`}>
                                    {description}
                                </p>
                                <Button
                                    id={`enroll-${type}`}
                                    aria-describedby={`description-${type}`}
                                    className="mt-2"
                                    variant="secondary"
                                    isPending={actionInProgress === type}
                                    isDisabled={!connection || hasSetup || (working && actionInProgress !== type)}
                                    onPress={type === "passkey" ? enrollPasskey : () => update(type)}
                                >
                                    {action}
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            </section>
            {(passkeyPrompt || verifyingPasskey) && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <div role="status" className="flex items-center gap-2 text-sm text-blue-900">
                        <span
                            aria-hidden="true"
                            className="size-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
                        />
                        {verifyingPasskey ? (
                            <Trans>Verifying the passkey with eduMFA…</Trans>
                        ) : (
                            <Trans>
                                Waiting for your browser or passkey manager. If no prompt appears, try opening this page
                                in a regular browser tab.
                            </Trans>
                        )}
                    </div>
                    {passkeyPrompt && (
                        <Button variant="secondary" onPress={() => passkeyPrompt.abort()}>
                            <Trans>Cancel passkey creation</Trans>
                        </Button>
                    )}
                </div>
            )}
            {error && (
                <p
                    className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-danger-soft-foreground"
                    role="alert"
                >
                    {error}
                </p>
            )}
            {qr && (
                <section className="rounded-xl border border-separator bg-surface p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h2 className="scroll-mt-20 font-semibold" ref={focusHeading} tabIndex={-1}>
                                {qr.type === "totp" ? (
                                    <Trans>Scan with your authenticator app</Trans>
                                ) : (
                                    <Trans>Scan with eduMFA Authenticator</Trans>
                                )}
                            </h2>
                            <p className="mt-1 font-mono text-sm">{qr.serial}</p>
                        </div>
                        <Button variant="ghost" onPress={() => closeEnrollment(qr.type)}>
                            <Trans>Close QR code</Trans>
                        </Button>
                    </div>
                    <Image
                        className="mt-4 size-64 max-w-full object-contain"
                        src={qr.image}
                        alt={qr.type === "totp" ? t`TOTP enrollment QR code` : t`Push token enrollment QR code`}
                        width={256}
                        height={256}
                        unoptimized
                    />
                </section>
            )}
            {matrix && <IndexedSecretMatrix enrollment={matrix} onClose={() => closeEnrollment("indexedsecret")} />}
            <section
                aria-labelledby="test-tokens"
                className="overflow-hidden rounded-xl border border-separator bg-surface shadow-sm"
            >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-separator px-4 py-3 sm:px-5">
                    <h2 className="scroll-mt-20 text-lg font-semibold" id="test-tokens" tabIndex={-1}>
                        <Trans>Your test tokens</Trans>
                    </h2>
                    <Button variant="ghost" size="sm" isDisabled={working} onPress={() => update("refresh")}>
                        <Trans>Refresh</Trans>
                    </Button>
                </div>
                {connection ? (
                    tokens.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-muted sm:px-5">
                            <Trans>No test tokens yet.</Trans>
                        </p>
                    ) : (
                        <ul className="divide-y divide-separator">
                            {tokens.map((token) => (
                                <TokenRow key={token.serial} token={token} connection={connection} onRemove={removed} />
                            ))}
                        </ul>
                    )
                ) : (
                    working && (
                        <p className="px-4 py-6 text-sm text-muted sm:px-5" role="status">
                            <Trans>Loading test tokens…</Trans>
                        </p>
                    )
                )}
            </section>
        </div>
    );
}

export function TokenTester({serviceUrl, passkeysEnabled}: {serviceUrl?: string; passkeysEnabled: boolean}) {
    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            <NavigationBar />
            <main className="mx-auto w-full max-w-6xl grow px-4 py-8 sm:px-6 sm:py-10">
                <h1 className="text-3xl font-bold">
                    <Trans>Token tester</Trans>
                </h1>
                <p className="mt-2 mb-8 text-muted">
                    <Trans>Enroll a test token, then verify it with eduMFA.</Trans>
                </p>
                {serviceUrl ? (
                    <TokenList key={serviceUrl} serviceUrl={serviceUrl} passkeysEnabled={passkeysEnabled} />
                ) : (
                    <p className="text-gray-600">
                        <Trans>The token tester is currently unavailable.</Trans>
                    </p>
                )}
            </main>
            <Footer />
        </div>
    );
}
