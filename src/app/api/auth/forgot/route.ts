import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueResetToken } from "@/lib/resetToken";
import { sendEmail } from "@/lib/brevo";
import { siteOrigin } from "@/lib/site";
import { checkRate, getClientIp } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().email() });

/**
 * POST /api/auth/forgot
 * Always returns 200 (don't reveal whether the email exists). Sends a reset
 * email only if the user is real and active. Rate-limited per IP to 5/hour.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRate(`forgot:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true }); // silently rate-limit
  }
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: true }); // silently 200

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && user.isActive) {
    const token = await issueResetToken(user.id);
    const link = `${siteOrigin()}/admin/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await sendEmail({
        to: [{ email: user.email, name: user.fullName }],
        subject: "Password reset for the school admin portal",
        htmlContent: `<p>Hi ${escapeHtml(user.fullName)},</p>
<p>You requested a password reset. Click the link below to set a new password. The link is valid for one hour:</p>
<p><a href="${link}">${link}</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
      });
    } catch (e) {
      // Don't surface Brevo errors to the caller; log server-side.
      console.error("forgot-password email failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!));
}
