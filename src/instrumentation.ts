export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const {getTesterService, testerConfigured} = await import("../server/push-tester/runtime");
        if (testerConfigured()) {
            await getTesterService().catch(() => {
                console.error("Token tester initialization failed. It will retry.");
            });
        }
    }
}
