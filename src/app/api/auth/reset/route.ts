import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/resetToken";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const uid = await verifyResetToken(parsed.data.token);
  if (!uid) return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });

  const hash = await bcrypt.hash(parsed.data.password, 10);
  try {
    await prisma.user.update({ where: { id: uid }, data: { passwordHash: hash } });
    await logAudit({ action: "user.passwordReset", entity: "User", entityId: uid });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
