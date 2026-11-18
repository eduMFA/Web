const maxConcurrent = 32;
const maxRequestsPerMinute = 1200;
const maxRequestsPerIpPerMinute = 120;
const maxEnrollmentsPerIpPerMinute = 5;

export function createTrafficLimits() {
    const clients = new Map<string, {requests: number; enrollments: number}>();
    let minute = -1;
    let requests = 0;
    let inFlight = 0;

    return {
        admit(address: string, enrolling: boolean, now: number) {
            const currentMinute = Math.floor(now / 60_000);
            if (currentMinute !== minute) {
                minute = currentMinute;
                requests = 0;
                clients.clear();
            }
            if (inFlight >= maxConcurrent || requests >= maxRequestsPerMinute) return false;
            const client = clients.get(address) ?? {requests: 0, enrollments: 0};
            if (
                client.requests >= maxRequestsPerIpPerMinute ||
                (enrolling && client.enrollments >= maxEnrollmentsPerIpPerMinute)
            )
                return false;
            client.requests++;
            if (enrolling) client.enrollments++;
            clients.set(address, client);
            requests++;
            inFlight++;
            return true;
        },
        release() {
            inFlight--;
        },
    };
}
