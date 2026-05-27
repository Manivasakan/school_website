import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma 6 + Neon adapter. The adapter accepts a connection string directly —
 * we no longer manually create a `Pool` from `@neondatabase/serverless` (the
 * adapter handles it). Combined with `prisma generate --no-engine` this gives
 * us a bundle with no query-engine binary lookups, which is exactly what we
 * need for Cloudflare Workers (where `fs.readdir` on the engine directory
 * blows up under unenv).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
