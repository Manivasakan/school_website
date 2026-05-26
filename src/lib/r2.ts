import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Generates a short-lived presigned PUT URL the browser can upload to directly.
 * Keeps large file bytes from passing through our Worker.
 */
export async function getPresignedUploadUrl(opts: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: opts.key,
    ContentType: opts.contentType,
  });
  const url = await getSignedUrl(client(), cmd, {
    expiresIn: opts.expiresInSeconds ?? 60 * 5,
  });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${opts.key}`;
  return { url, publicUrl };
}

/**
 * Permanently delete an object from R2. Silently swallows "not found" errors so
 * orphaned MediaItem rows can still be removed.
 */
export async function deleteObject(key: string) {
  if (!key) return;
  try {
    await client().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );
  } catch (e: any) {
    if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) return;
    throw e;
  }
}

export function buildMediaKey(originalName: string) {
  const ext = originalName.split(".").pop() || "bin";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `media/${new Date().getFullYear()}/${id}.${safeExt}`;
}
