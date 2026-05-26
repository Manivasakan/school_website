import { SignJWT, jwtVerify } from "jose";

/**
 * Short-lived password-reset tokens signed with AUTH_SECRET.
 * Stateless (no DB row) — expires in 1 hour.
 */
const ALG = "HS256";
const EXPIRES_IN = "1h";

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(secret);
}

export async function issueResetToken(userId: string): Promise<string> {
  return new SignJWT({ uid: userId, kind: "pwd-reset" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(key());
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.kind !== "pwd-reset" || typeof payload.uid !== "string") return null;
    return payload.uid;
  } catch {
    return null;
  }
}
