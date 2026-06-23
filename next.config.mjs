/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js not to bundle these native Node modules
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
