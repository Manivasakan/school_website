"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { deleteObject } from "@/lib/r2";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  fileUrl: z.string().url(),
  fileKey: z.string().min(1),
  category: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
  sizeBytes: z.number().int().optional(),
  mimeType: z.string().optional(),
});

export async function saveDownload(formData: FormData) {
  await requirePermission("Downloads.Manage");
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("Missing payload");
  const parsed = schema.parse(JSON.parse(raw));

  const data = {
    title: parsed.title,
    description: parsed.description ?? null,
    fileUrl: parsed.fileUrl,
    fileKey: parsed.fileKey,
    category: parsed.category ?? null,
    sortOrder: parsed.sortOrder ?? 0,
    sizeBytes: parsed.sizeBytes ?? null,
    mimeType: parsed.mimeType ?? null,
  };

  if (parsed.id) {
    await prisma.download.update({ where: { id: parsed.id }, data });
    await logAudit({ action: "download.update", entity: "Download", entityId: parsed.id });
  } else {
    const created = await prisma.download.create({ data });
    await logAudit({ action: "download.create", entity: "Download", entityId: created.id });
  }

  revalidatePath("/admin/downloads");
  revalidatePath("/", "layout");
  redirect("/admin/downloads");
}

export async function deleteDownload(formData: FormData) {
  await requirePermission("Downloads.Manage");
  const id = String(formData.get("id"));
  const dl = await prisma.download.findUnique({ where: { id } });
  if (!dl) return;
  try {
    if (dl.fileKey) await deleteObject(dl.fileKey);
  } catch (e) {
    console.error("R2 delete failed for", dl.fileKey, e);
  }
  await prisma.download.delete({ where: { id } });
  await logAudit({ action: "download.delete", entity: "Download", entityId: id });
  revalidatePath("/admin/downloads");
}
