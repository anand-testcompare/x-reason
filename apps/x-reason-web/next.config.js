/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.CI !== 'true',
  },
  eslint: {
    ignoreDuringBuilds: process.env.CI !== 'true',
  },
};

export default nextConfig;
