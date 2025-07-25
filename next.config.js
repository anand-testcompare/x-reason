/** @type {import('next').NextConfig} */
const nextConfig = {
    // required for jest, see this issue: https://github.com/vercel/next.js/issues/52541
    transpilePackages: ['ramda'],
    
    // Allow external hosts for development (fixes CodeSandbox/Gitpod/etc. access)
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                ],
            },
        ];
    },
    
    // Configure for external access
    experimental: {
        externalDir: true,
    }
}

module.exports = nextConfig
