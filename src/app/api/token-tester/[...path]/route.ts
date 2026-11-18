import {isIP} from "node:net";
import {getTesterService} from "../../../../../server/token-tester/runtime";
import {testerSetting} from "../../../../../server/token-tester/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readBody(request: Request) {
    const reader = request.body?.getReader();
    if (!reader) return "";
    const chunks: Uint8Array[] = [];
    let size = 0;
    let expired = false;
    const timeout = setTimeout(() => {
        expired = true;
        void reader.cancel();
    }, 5000);
    try {
        for (;;) {
            const {done, value} = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 65_536) throw new Error("Tester request too large.");
            chunks.push(value);
        }
        if (expired) throw new Error("Tester request timed out.");
        return Buffer.concat(chunks).toString("utf8");
    } finally {
        clearTimeout(timeout);
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
    }
}

async function handle(request: Request) {
    try {
        const origin = testerSetting("ORIGIN");
        if (!origin)
            return Response.json(
                {error: "The token tester is currently unavailable."},
                {status: 503, headers: {"Cache-Control": "no-store"}},
            );
        // Browsers can omit Origin on same-origin GET requests.
        const requestOrigin = request.headers.get("origin");
        if (
            (requestOrigin && requestOrigin !== new URL(origin).origin) ||
            (!requestOrigin && (request.method !== "GET" || request.headers.get("sec-fetch-site") !== "same-origin"))
        ) {
            return new Response(null, {status: 403});
        }
        const service = await getTesterService();
        const url = new URL(request.url);
        url.pathname = url.pathname.replace(/^\/api\/(?:token|push)-tester/, "");
        const headers = new Headers(request.headers);
        headers.set("origin", new URL(origin).origin);
        const forwarded = request.headers.get("x-real-ip");
        // Direct Next.js requests share a bucket because Route Handlers expose no peer socket.
        const address = testerSetting("TRUST_PROXY") === "1" && forwarded && isIP(forwarded) ? forwarded : "direct";
        const action = new Request(url, {method: request.method, headers});
        return await service.handle(action, address, () => readBody(request));
    } catch {
        return Response.json(
            {error: "The token tester could not complete the request. Try again shortly."},
            {status: 503, headers: {"Cache-Control": "no-store"}},
        );
    }
}

export {handle as GET, handle as POST, handle as DELETE, handle as OPTIONS};
