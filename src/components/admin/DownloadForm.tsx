"use client";

import { useState } from "react";
import { saveDownload } from "@/lib/actions/downloads";

/**
 * Allows admin to upload a PDF/document directly to R2 (presigned), then save the
 * metadata row. We reuse /api/upload (which accepts any content type matching
 * (image|video|application)/...).
 */
export default function DownloadForm({
  initial,
}: {
  initial?: {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileKey: string;
    category: string | null;
    sortOrder: number;
  };
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl ?? "");
  const [fileKey, setFileKey] = useState(initial?.fileKey ?? "");
  const [sizeBytes, setSizeBytes] = useState<number | undefined>();
  const [mimeType, setMimeType] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          album: "downloads",
        }),
      });
      if (!res.ok) throw new Error(`Presign failed (${res.status})`);
      const { uploadUrl, publicUrl, media } = (await res.json()) as {
        uploadUrl: string; publicUrl: string; media: { key: string };
      };
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);
      setFileUrl(publicUrl);
      setFileKey(media.key);
      setSizeBytes(file.size);
      setMimeType(file.type);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={saveDownload}>
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          id: initial?.id,
          title,
          description: description || undefined,
          fileUrl,
          fileKey,
          category: category || undefined,
          sortOrder,
          sizeBytes,
          mimeType,
        })}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3 rounded border bg-white p-4">
          <label className="block">
            <span className="text-sm font-medium">Title *</span>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Description</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Category</span>
              <input
                type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Past Papers - O/L, Admission Forms"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Sort order</span>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
            </label>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded border bg-white p-4">
            <div className="text-sm font-medium">File</div>
            {fileUrl ? (
              <div className="mt-2">
                <a href={fileUrl} target="_blank" rel="noopener" className="text-xs text-brand-500 hover:underline break-all">
                  {fileUrl}
                </a>
                <button type="button" onClick={() => { setFileUrl(""); setFileKey(""); }} className="mt-2 block text-xs text-red-600 hover:underline">
                  Remove and choose another
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,application/*"
                disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                className="mt-2 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white hover:file:bg-brand-600"
              />
            )}
            {uploading && <div className="mt-1 text-xs text-slate-500">Uploading...</div>}
            {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
          </div>
          <button type="submit" disabled={!fileUrl} className="w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
            Save
          </button>
        </aside>
      </div>
    </form>
  );
}
