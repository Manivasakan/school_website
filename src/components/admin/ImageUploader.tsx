"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";

type UploadResult = {
  publicUrl: string;
  media: { id: string; url: string };
};

/**
 * Resizes the chosen image to ≤1920px WebP in the browser, requests a presigned
 * PUT URL from /api/upload, uploads directly to Cloudflare R2, and calls
 * `onUploaded` with the public URL.
 *
 * Use `value` to display an existing image; clearing it is parent's responsibility.
 */
export default function ImageUploader({
  value,
  onUploaded,
  album,
  alt,
  label = "Upload image",
}: {
  value?: string | null;
  onUploaded: (publicUrl: string, mediaId: string) => void;
  album?: string;
  alt?: string;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    setProgress(10);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
      });
      setProgress(40);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name.replace(/\.[^.]+$/, ".webp"),
          contentType: "image/webp",
          sizeBytes: compressed.size,
          alt,
          album,
        }),
      });
      if (!res.ok) throw new Error(`Failed to get upload URL (${res.status})`);
      const { uploadUrl, publicUrl, media } = (await res.json()) as {
        uploadUrl: string;
        publicUrl: string;
        media: UploadResult["media"];
      };
      setProgress(60);

      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/webp" },
        body: compressed,
      });
      if (!put.ok) throw new Error(`Upload to R2 failed (${put.status})`);
      setProgress(100);

      onUploaded(publicUrl, media.id);
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="h-32 w-auto rounded border bg-slate-50 object-contain"
        />
      )}
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white hover:file:bg-brand-600"
      />
      {uploading && (
        <div className="h-1 w-full overflow-hidden rounded bg-slate-200">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}
