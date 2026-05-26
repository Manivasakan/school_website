"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import { logAudit } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize";

const schema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  translations: z.array(
    z.object({
      languageCode: z.string(),
      title: z.string().max(300),
      description: z.string().max(10000).optional(),
    })
  ),
});

export async function saveEvent(formData: FormData) {
  await requirePermission("Events.Manage");
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("Missing payload");
  const result = schema.safeParse(safeJson(raw));
  if (!result.success) throw new Error("Invalid input");
  const parsed = result.data;

  if (parsed.id) {
    // Editing: preserve existing slug unless explicitly changed.
    const existing = await prisma.event.findUnique({ where: { id: parsed.id } });
    if (!existing) throw new Error("Not found");
    const slug = parsed.slug?.trim() ? slugify(parsed.slug) : existing.slug;

    const translations = parsed.translations
      .filter((t) => t.title.trim())
      .map((t) => ({
        languageCode: t.languageCode,
        title: t.title,
        description: t.description ? sanitizeHtml(t.description) : null,
      }));

    await prisma.event.update({
      where: { id: parsed.id },
      data: {
        slug,
        startsAt: new Date(parsed.startsAt),
        endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
        location: parsed.location ?? null,
        isPublished: parsed.isPublished ?? true,
      },
    });
    await prisma.eventTranslation.deleteMany({ where: { eventId: parsed.id } });
    if (translations.length) {
      await prisma.eventTranslation.createMany({
        data: translations.map((t) => ({ eventId: parsed.id!, ...t })),
      });
    }
    await logAudit({ action: "event.update", entity: "Event", entityId: parsed.id });
  } else {
    const slug = parsed.slug?.trim()
      ? slugify(parsed.slug)
      : slugify(parsed.translations.find((t) => t.title)?.title ?? `event-${Date.now()}`);
    const translations = parsed.translations
      .filter((t) => t.title.trim())
      .map((t) => ({
        languageCode: t.languageCode,
        title: t.title,
        description: t.description ? sanitizeHtml(t.description) : null,
      }));
    const created = await prisma.event.create({
      data: {
        slug,
        startsAt: new Date(parsed.startsAt),
        endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
        location: parsed.location ?? null,
        isPublished: parsed.isPublished ?? true,
        translations: { create: translations },
      },
    });
    await logAudit({ action: "event.create", entity: "Event", entityId: created.id });
  }

  revalidatePath("/admin/events");
  revalidatePath("/", "layout");
  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData) {
  await requirePermission("Events.Manage");
  const id = String(formData.get("id"));
  await prisma.event.delete({ where: { id } });
  await logAudit({ action: "event.delete", entity: "Event", entityId: id });
  revalidatePath("/admin/events");
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
