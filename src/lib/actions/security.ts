"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateTotpSecret, verifyTotp } from "@/lib/totp";
import { logAudit } from "@/lib/audit";

async function currentUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Unauthorized");
  return id;
}

/** Change own password — requires current password. */
export async function changeOwnPassword(formData: FormData) {
  const uid = await currentUserId();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) throw new Error("New password must be at least 8 characters");
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) throw new Error("Not found");
  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) throw new Error("Current password is wrong");
  await prisma.user.update({
    where: { id: uid },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  await logAudit({ action: "user.passwordChange", entity: "User", entityId: uid });
  revalidatePath("/admin/profile");
}

/**
 * Generate (but do not enable) a new TOTP secret for the current user.
 * Persisted to DB immediately so the QR code is stable across re-renders,
 * but totpEnabled stays false until the user confirms with a valid code.
 */
export async function startTotpSetup(): Promise<void> {
  const uid = await currentUserId();
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: uid },
    data: { totpSecret: secret, totpEnabled: false },
  });
  revalidatePath("/admin/profile");
}

/** Confirm setup by submitting a valid 6-digit code. Enables 2FA. */
export async function confirmTotp(formData: FormData) {
  const uid = await currentUserId();
  const code = String(formData.get("code") ?? "");
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.totpSecret) throw new Error("No pending setup");
  if (!verifyTotp(user.totpSecret, code)) throw new Error("Invalid code");
  await prisma.user.update({ where: { id: uid }, data: { totpEnabled: true } });
  await logAudit({ action: "user.totpEnabled", entity: "User", entityId: uid });
  revalidatePath("/admin/profile");
}

/** Disable 2FA — requires entering a current valid TOTP code as proof. */
export async function disableTotp(formData: FormData) {
  const uid = await currentUserId();
  const code = String(formData.get("code") ?? "");
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.totpEnabled || !user.totpSecret) return;
  if (!verifyTotp(user.totpSecret, code)) throw new Error("Invalid code");
  await prisma.user.update({
    where: { id: uid },
    data: { totpEnabled: false, totpSecret: null },
  });
  await logAudit({ action: "user.totpDisabled", entity: "User", entityId: uid });
  revalidatePath("/admin/profile");
}
