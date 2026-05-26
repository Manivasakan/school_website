"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseVideoUrl, thumbnailUrl } from "@/lib/youtube";
import { logAudit } from "@/lib/audit";
import { deleteObject } from "@/lib/r2";

export async function updateMedia(formData: FormData) {
  await requirePermission("Media.Upload");
  const id = String(formData.get("id"));
  await prisma.mediaItem.update({
    where: { id },
    data: {
      alt: String(formData.get("alt") || ""),
      caption: String(formData.get("caption") || ""),
      album: String(formData.get("album") || "") || null,
    },
  });
  revalidatePath("/admin/gallery/photos");
}

export async function deleteMedia(formData: FormData) {
  await requirePermission("Media.Delete");
  const id = String(formData.get("id"));
  const item = await prisma.mediaItem.findUnique({ where: { id } });
  if (!item) return;
  // Best-effort: remove the R2 object first, then drop the DB row. If R2 deletion
  // fails we still delete the DB record so the admin UI isn't blocked — orphans
  // can be reaped later by a cron.
  try {
    await deleteObject(item.key);
  } catch (e) {
    console.error("R2 delete failed for", item.key, e);
  }
  await prisma.mediaItem.delete({ where: { id } });
  await logAudit({ action: "media.delete", entity: "MediaItem", entityId: id });
  revalidatePath("/admin/gallery/photos");
}

const videoSchema = z.object({
  url: z.string().url(),
  title: z.string().max(300).optional(),
  caption: z.string().max(2000).optional(),
  album: z.string().max(100).optional(),
});

export async function addVideo(formData: FormData) {
  await requirePermission("Videos.Manage");
  const parsed = videoSchema.parse({
    url: String(formData.get("url") || ""),
    title: String(formData.get("title") || ""),
    caption: String(formData.get("caption") || ""),
    album: String(formData.get("album") || ""),
  });
  const meta = parseVideoUrl(parsed.url);
  if (!meta) throw new Error("Unrecognized video URL");

  await prisma.videoItem.create({
    data: {
      provider: meta.provider,
      videoId: meta.videoId,
      title: parsed.title || null,
      caption: parsed.caption || null,
      thumbnail: thumbnailUrl(meta.provider, meta.videoId),
      album: parsed.album || null,
    },
  });
  await logAudit({ action: "video.create" });
  revalidatePath("/admin/gallery/videos");
}

export async function deleteVideo(formData: FormData) {
  await requirePermission("Videos.Manage");
  const id = String(formData.get("id"));
  await prisma.videoItem.delete({ where: { id } });
  await logAudit({ action: "video.delete", entity: "VideoItem", entityId: id });
  revalidatePath("/admin/gallery/videos");
}
