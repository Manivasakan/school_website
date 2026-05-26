import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { buildMediaKey, getPresignedUploadUrl } from "@/lib/r2";
import { prisma } from "@/lib/prisma";

// Whitelist of allowed MIME types. Anything outside this list is rejected.
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

// Albums where the uploaded file is NOT a piece of public gallery content.
// We still presign + upload, but skip creating a `MediaItem` row so they don't
// pollute /admin/gallery/photos or the public gallery.
const NON_GALLERY_ALBUMS = new Set(["downloads", "avatars", "site", "staff"]);

const schema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string(),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().max(300).optional(),
  album: z.string().max(100).optional(),
});

/**
 * POST /api/upload — returns a presigned PUT URL for direct browser upload to R2.
 * Creates a `MediaItem` row only for true gallery uploads (so PDFs, avatars,
 * the hero image, and staff photos don't show up in the photo gallery).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await hasPermission("Media.Upload"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.has(parsed.data.contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const key = buildMediaKey(parsed.data.fileName);
  const { url: uploadUrl, publicUrl } = await getPresignedUploadUrl({
    key,
    contentType: parsed.data.contentType,
  });

  // Only true gallery images get a MediaItem row. Other categories are just stored.
  const isGalleryImage =
    parsed.data.contentType.startsWith("image/") &&
    !NON_GALLERY_ALBUMS.has(parsed.data.album ?? "");

  let media: { id: string; url: string; key: string } | null = null;
  if (isGalleryImage) {
    media = await prisma.mediaItem.create({
      data: {
        url: publicUrl,
        key,
        alt: parsed.data.alt ?? null,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
        sizeBytes: parsed.data.sizeBytes,
        mimeType: parsed.data.contentType,
        album: parsed.data.album ?? null,
      },
      select: { id: true, url: true, key: true },
    });
  } else {
    // Fabricate a media-shaped object so the client API stays consistent.
    media = { id: "", url: publicUrl, key };
  }

  return NextResponse.json({ uploadUrl, publicUrl, media });
}
