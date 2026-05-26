import { auth } from "./auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function hasPermission(key: string): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  return (user.permissions ?? []).includes(key);
}

export async function requirePermission(key: string): Promise<void> {
  const ok = await hasPermission(key);
  if (!ok) {
    throw new Error(`Forbidden: missing permission "${key}"`);
  }
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
