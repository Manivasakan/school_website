"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";

/**
 * Bulk image uploader for the gallery. Compresses each selected file in the
 * browser, posts a presigned URL request, uploads to R2, then reloads the page
 * so the new MediaItem rows appear.
 */
export default function GalleryUploader({ defaultAlbum }: { defaultAlbum?: string }) {
  const [album, setAlbum] = useState(defaultAlbum ?? "");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setLog([]);
    for (const file of Array.from(files)) {
      try {
        setLog((l) => [...l, `Compressing ${file.name}...`]);
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        });
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name.replace(/\.[^.]+$/, ".webp"),
            contentType: "image/webp",
            sizeBytes: compressed.size,
            album: album || null,
          }),
        });
        if (!res.ok) throw new Error(`Presign failed (${res.status})`);
        const { uploadUrl } = (await res.json()) as { uploadUrl: string };
        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/webp" },
          body: compressed,
        });
        if (!put.ok) throw new Error(`R2 PUT failed (${put.status})`);
        setLog((l) => [...l, `✅ ${file.name}`]);
      } catch (e: any) {
        setLog((l) => [...l, `❌ ${file.name}: ${e?.message ?? "error"}`]);
      }
    }
    setBusy(false);
    setTimeout(() => location.reload(), 800);
  }

  return (
    <div className="rounded border bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm font-medium">Album (optional)</span>
          <input
            type="text"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="e.g. sports-day-2026"
            className="mt-1 rounded border px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Add photos</span>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
            className="mt-1 block text-sm file:mr-3 file:rounded file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white hover:file:bg-brand-600"
          />
        </label>
      </div>
      {log.length > 0 && (
        <ul className="mt-3 max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs">
          {log.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      )}
    </div>
  );
}
