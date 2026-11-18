/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: "/:locale(en|de)",
                destination: "/",
                permanent: true,
            },
            {
                source: "/:locale(en|de)/push-tester",
                destination: "/token-tester",
                permanent: true,
            },
            {
                source: "/push-tester",
                destination: "/token-tester",
                permanent: true,
            },
            {
                source: "/:locale(en|de)/token-tester",
                destination: "/token-tester",
                permanent: true,
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: "/api/push-tester/:path*",
                destination: "/api/token-tester/:path*",
            },
        ];
    },
};

export default nextConfig;
