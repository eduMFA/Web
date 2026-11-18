/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: "/:locale(en|de)",
                destination: "/",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
