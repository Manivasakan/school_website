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
  slug: z.string().min(1),
  isPublished: z.boolean().optional(),
  showInNav: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  translations: z.array(
    z.object({
      languageCode: z.string(),
      title: z.string().max(300),
      body: z.string().max(50000),
      metaDescription: z.string().max(300).optional(),
    })
  ),
});

export async function savePage(formData: FormData) {
  await requirePermission(formData.get("id") ? "Pages.Edit" : "Pages.Create");
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("Missing payload");
  const result = schema.safeParse(safeJson(raw));
  if (!result.success) throw new Error("Invalid input");
  const parsed = result.data;

  const slug = slugify(parsed.slug);
  const translations = parsed.translations
    .filter((t) => t.title.trim())
    .map((t) => ({ ...t, body: sanitizeHtml(t.body) }));

  if (parsed.id) {
    await prisma.page.update({
      where: { id: parsed.id },
      data: {
        slug,
        isPublished: Boolean(parsed.isPublished),
        showInNav: Boolean(parsed.showInNav),
        sortOrder: parsed.sortOrder ?? 0,
      },
    });
    await prisma.pageTranslation.deleteMany({ where: { pageId: parsed.id } });
    if (translations.length) {
      await prisma.pageTranslation.createMany({
        data: translations.map((t) => ({
          pageId: parsed.id!,
          languageCode: t.languageCode,
          title: t.title,
          body: t.body,
          metaDescription: t.metaDescription,
        })),
      });
    }
    await logAudit({ action: "page.update", entity: "Page", entityId: parsed.id });
  } else {
    const created = await prisma.page.create({
      data: {
        slug,
        isPublished: Boolean(parsed.isPublished),
        showInNav: Boolean(parsed.showInNav),
        sortOrder: parsed.sortOrder ?? 0,
        translations: { create: translations },
      },
    });
    await logAudit({ action: "page.create", entity: "Page", entityId: created.id });
  }

  revalidatePath("/admin/pages");
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

export async function deletePage(formData: FormData) {
  await requirePermission("Pages.Delete");
  const id = String(formData.get("id"));
  await prisma.page.delete({ where: { id } });
  await logAudit({ action: "page.delete", entity: "Page", entityId: id });
  revalidatePath("/admin/pages");
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
