import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/brevo";
import { verifyTurnstile } from "@/lib/turnstile";
import { prisma } from "@/lib/prisma";
import { checkRate, getClientIp } from "@/lib/rateLimit";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRate(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.turnstileToken) {
    const ok = await verifyTurnstile(parsed.data.turnstileToken, ip);
    if (!ok) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  }

  const setting = await prisma.siteSetting.findUnique({ where: { key: "contact.email" } });
  const to = setting?.value || process.env.SMTP_FROM || "info@school.lk";

  try {
    await sendEmail({
      to: [{ email: to }],
      replyTo: { email: parsed.data.email, name: parsed.data.name },
      subject: `Contact form: ${parsed.data.name}`,
      htmlContent: `<p><strong>From:</strong> ${escape(parsed.data.name)} (${escape(parsed.data.email)})</p>
        <p style="white-space:pre-wrap">${escape(parsed.data.message)}</p>`,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Send failed" }, { status: 500 });
  }
}

function escape(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!));
}
