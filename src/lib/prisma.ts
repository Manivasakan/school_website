import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Neon requires a WebSocket constructor in Node environments.
// In Cloudflare Workers / edge runtime the global WebSocket is already available.
if (typeof globalThis.WebSocket === "undefined") {
  // `ws` is a Node polyfill for the global WebSocket the Neon driver needs.
  neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
