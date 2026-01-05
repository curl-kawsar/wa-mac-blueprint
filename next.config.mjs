/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Server external packages (moved from experimental in Next.js 16)
  serverExternalPackages: ['mongoose', 'bcryptjs'],

  // Empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
