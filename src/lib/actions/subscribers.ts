"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { checkRate } from "@/lib/rateLimit";

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
});

/**
 * Public: anyone can subscribe. Idempotent on email. Rate-limited per IP
 * (5/hour) so the form can't be used to spam fake addresses into the table.
 */
export async function subscribe(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const h = await headers();
  const ip =
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (!checkRate(`subscribe:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many requests. Try again later." };
  }

  const parsed = subscribeSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? "") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid email" };

  try {
    await prisma.subscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email, name: parsed.data.name, isActive: true },
      update: { isActive: true, name: parsed.data.name ?? undefined },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not subscribe" };
  }
}

export async function removeSubscriber(formData: FormData) {
  await requirePermission("Settings.Edit");
  const id = String(formData.get("id"));
  await prisma.subscriber.delete({ where: { id } });
  await logAudit({ action: "subscriber.delete", entity: "Subscriber", entityId: id });
  revalidatePath("/admin/subscribers");
}
