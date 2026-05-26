import { Secret, TOTP } from "otpauth";

const ISSUER = "School Admin";

/** Generate a new TOTP secret (base32) for a user enabling 2FA. */
export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

/** Build the otpauth:// provisioning URI (used by QR code in the setup page). */
export function totpUri(opts: { secret: string; accountName: string; issuer?: string }): string {
  const totp = new TOTP({
    issuer: opts.issuer ?? ISSUER,
    label: opts.accountName,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(opts.secret),
  });
  return totp.toString();
}

/**
 * Verify a 6-digit code. Allows ±1 step (30s) drift for clock skew.
 * Returns true if valid.
 */
export function verifyTotp(secret: string, code: string): boolean {
  if (!secret || !code || !/^\d{6}$/.test(code)) return false;
  const totp = new TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
