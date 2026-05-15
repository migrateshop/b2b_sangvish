/** @type {import('next').NextConfig} */
const nextConfig = {    
    distDir: 'build',
    reactStrictMode: true,

    typescript: { ignoreBuildErrors: true },

    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;