import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(projectRoot, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  turbopack: {
    root: workspaceRoot,
  },
  typescript: {
    ignoreBuildErrors: process.env.CI !== 'true',
  },
};

export default nextConfig;
