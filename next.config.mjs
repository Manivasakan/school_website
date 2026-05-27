/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js NOT to bundle these packages into the server runtime.
  // Important for Cloudflare Workers: when bundled, Prisma's engine
  // discovery code triggers fs.readdir which unenv stubs out with a
  // "not implemented" error. Leaving them external lets the actual
  // installed modules load from node_modules at runtime, where the
  // Workers nodejs compat layer takes over.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
