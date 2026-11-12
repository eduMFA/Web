"use client";

import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {Button} from "@heroui/react";
import {Trans, useLingui} from "@lingui/react/macro";
import {Footer} from "@/components/Footer";
import {NavigationBar} from "@/components/NavigationBar";
import {
    connect,
    enrollToken,
    listTokens,
    readChallenge,
    removeToken,
    triggerChallenge,
    type Connection,
    type ChallengeStatus,
    type PushToken,
} from "./edumfa";

const results = {
    pending: {label: <Trans>Waiting for a response…</Trans>, color: "bg-blue-100 text-blue-900"},
    accepted: {label: <Trans>Challenge accepted</Trans>, color: "bg-green-100 text-green-900", icon: "✓"},
    declined: {label: <Trans>Challenge declined</Trans>, color: "bg-red-100 text-red-900", icon: "×"},
    expired: {label: <Trans>Challenge expired</Trans>, color: "bg-amber-100 text-amber-900"},
    paused: {label: <Trans>Status check paused</Trans>, color: "bg-gray-100 text-gray-900"},
};

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

function TokenRow({
    token,
    connection,
    onRemove,
}: {
    token: PushToken;
    connection: Connection;
    onRemove: (serial: string) => void;
}) {
    const {serial} = token;
    const [working, setWorking] = useState(false);
    const [transaction, setTransaction] = useState<string>();
    const [status, setStatus] = useState<ChallengeStatus>();
    const [error, setError] = useState("");
    const pending = status === "pending";
    const result = status && results[pending && error ? "paused" : status];

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
        if (pending) {
            setError("");
            return;
        }
        setWorking(true);
        setError("");
        try {
            setTransaction(await triggerChallenge(connection, serial));
            setStatus("pending");
        } catch (error) {
            setError(errorMessage(error));
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

    return (
        <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
                <h3 className="font-mono font-medium break-all">{serial}</h3>
                <p className="mt-1 text-sm text-gray-600" role="status">
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
                            {result.label}
                        </span>
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-700" role="alert">
                        {error}
                    </p>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="secondary"
                    isDisabled={working || (pending ? !error : !token.enrolled || !token.active)}
                    onPress={challenge}
                >
                    {pending && error ? <Trans>Retry status check</Trans> : <Trans>Send challenge</Trans>}
                </Button>
                <Button variant="danger-soft" isDisabled={working} onPress={remove}>
                    <Trans>Remove</Trans>
                </Button>
            </div>
        </li>
    );
}

function TokenList({serviceUrl}: {serviceUrl: string}) {
    const {t} = useLingui();
    const [connection, setConnection] = useState<Connection>();
    const [tokens, setTokens] = useState<PushToken[]>([]);
    const revision = useRef(0);
    const [qr, setQr] = useState<Awaited<ReturnType<typeof enrollToken>>>();
    const [working, setWorking] = useState(true);
    const [error, setError] = useState("");

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
                if (!controller.signal.aborted) setWorking(false);
            }
        }
        void load();
        return () => controller.abort();
    }, [serviceUrl]);

    useEffect(() => {
        if (!qr || !connection) return;
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

    async function update(action: "refresh" | "enroll") {
        setWorking(true);
        setError("");
        try {
            if (action === "refresh") {
                const currentConnection = connection ?? connect(serviceUrl);
                const startedAt = revision.current;
                const refreshed = await listTokens(currentConnection);
                setConnection(currentConnection);
                if (startedAt === revision.current) setTokens(refreshed);
            } else if (connection) {
                const enrollment = await enrollToken(connection);
                setTokens((tokens) => [{serial: enrollment.serial, enrolled: false, active: false}, ...tokens]);
                setQr(enrollment);
            }
        } catch (error) {
            setError(errorMessage(error));
        } finally {
            setWorking(false);
        }
    }

    function removed(serial: string) {
        revision.current++;
        setTokens((tokens) => tokens.filter((token) => token.serial !== serial));
        setQr((qr) => (qr?.serial === serial ? undefined : qr));
    }

    return (
        <>
            <div className="mb-6 flex flex-wrap justify-end gap-2">
                <Button variant="secondary" isDisabled={working} onPress={() => update("refresh")}>
                    <Trans>Refresh</Trans>
                </Button>
                <Button isDisabled={!connection || working || !!qr} onPress={() => update("enroll")}>
                    <Trans>Enroll token</Trans>
                </Button>
            </div>
            {error && (
                <p className="mb-4 text-red-700" role="alert">
                    {error}
                </p>
            )}
            {qr && (
                <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h2 className="font-semibold">
                                <Trans>Scan with eduMFA Authenticator</Trans>
                            </h2>
                            <p className="mt-1 font-mono text-sm">{qr.serial}</p>
                        </div>
                        <Button variant="ghost" onPress={() => setQr(undefined)}>
                            <Trans>Close QR code</Trans>
                        </Button>
                    </div>
                    <Image
                        className="mt-4 size-64 max-w-full object-contain"
                        src={qr.image}
                        alt={t`Push token enrollment QR code`}
                        width={256}
                        height={256}
                        unoptimized
                    />
                </section>
            )}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <h2 className="border-b border-gray-200 px-5 py-4 text-lg font-semibold">
                    <Trans>Test tokens</Trans>
                </h2>
                {connection ? (
                    tokens.length === 0 ? (
                        <p className="px-5 py-8 text-gray-600">
                            <Trans>No test tokens yet.</Trans>
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {tokens.map((token) => (
                                <TokenRow key={token.serial} token={token} connection={connection} onRemove={removed} />
                            ))}
                        </ul>
                    )
                ) : (
                    working && (
                        <p className="px-5 py-8 text-gray-600" role="status">
                            <Trans>Loading test tokens…</Trans>
                        </p>
                    )
                )}
            </section>
        </>
    );
}

export function PushTester({serviceUrl}: {serviceUrl?: string}) {
    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            <NavigationBar />
            <main className="mx-auto w-full max-w-4xl grow px-4 py-10">
                <h1 className="text-3xl font-bold">
                    <Trans>Push token tester</Trans>
                </h1>
                <p className="mt-2 mb-8 text-gray-600">
                    <Trans>Enroll an eduPUSH token and check how your device responds to a push challenge.</Trans>
                </p>
                {serviceUrl ? (
                    <TokenList key={serviceUrl} serviceUrl={serviceUrl} />
                ) : (
                    <p className="text-gray-600">
                        <Trans>The Push token tester is currently unavailable.</Trans>
                    </p>
                )}
            </main>
            <Footer />
        </div>
    );
}
