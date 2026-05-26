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
  slug: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
  featuredImage: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  translations: z.array(
    z.object({
      languageCode: z.string().min(2).max(5),
      title: z.string().max(300),
      body: z.string().max(50000),
    })
  ),
});

export async function saveNews(formData: FormData) {
  await requirePermission(formData.get("id") ? "News.Edit" : "News.Create");

  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("Missing payload");
  const result = schema.safeParse(safeJson(raw));
  if (!result.success) throw new Error("Invalid input");
  const parsed = result.data;

  const cleanTranslations = parsed.translations
    .filter((t) => t.title.trim())
    .map((t) => ({ ...t, body: sanitizeHtml(t.body) }));

  if (parsed.id) {
    // Editing: preserve existing slug + publishedAt unless explicitly changed.
    const existing = await prisma.news.findUnique({ where: { id: parsed.id } });
    if (!existing) throw new Error("Not found");

    const slug = parsed.slug?.trim() || existing.slug;
    const willPublish = Boolean(parsed.isPublished);
    // Only set publishedAt on a transition from unpublished -> published.
    const publishedAt =
      willPublish && !existing.publishedAt ? new Date() : existing.publishedAt;

    await prisma.news.update({
      where: { id: parsed.id },
      data: {
        slug,
        isPublished: willPublish,
        featuredImage: parsed.featuredImage ?? null,
        category: parsed.category ?? null,
        publishedAt: willPublish ? publishedAt : null,
      },
    });
    await prisma.newsTranslation.deleteMany({ where: { newsId: parsed.id } });
    if (cleanTranslations.length > 0) {
      await prisma.newsTranslation.createMany({
        data: cleanTranslations.map((t) => ({
          newsId: parsed.id!,
          languageCode: t.languageCode,
          title: t.title,
          body: t.body,
        })),
      });
    }
    await logAudit({ action: "news.update", entity: "News", entityId: parsed.id });
  } else {
    const slug =
      parsed.slug?.trim() ||
      slugify(parsed.translations.find((t) => t.title)?.title ?? "untitled");
    const isPublished = Boolean(parsed.isPublished);
    const created = await prisma.news.create({
      data: {
        slug,
        isPublished,
        featuredImage: parsed.featuredImage ?? null,
        category: parsed.category ?? null,
        publishedAt: isPublished ? new Date() : null,
        translations: { create: cleanTranslations },
      },
    });
    await logAudit({ action: "news.create", entity: "News", entityId: created.id });
  }

  revalidatePath("/admin/news");
  revalidatePath("/", "layout");
  redirect("/admin/news");
}

export async function deleteNews(formData: FormData) {
  await requirePermission("News.Delete");
  const id = String(formData.get("id"));
  await prisma.news.delete({ where: { id } });
  await logAudit({ action: "news.delete", entity: "News", entityId: id });
  revalidatePath("/admin/news");
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
