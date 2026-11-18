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
                destination: "/push-tester",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
