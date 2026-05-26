import { prisma } from "./prisma";

/** Absolute origin for the deployed site. */
export function siteOrigin(): string {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Load every site setting once and return a `(key)=>value` getter + the raw rows. */
export async function loadSettings() {
  const rows = await prisma.siteSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    rows,
    get: (k: string, fallback = "") => map.get(k) ?? fallback,
  };
}
