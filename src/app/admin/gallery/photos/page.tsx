import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import GalleryUploader from "@/components/admin/GalleryUploader";
import { deleteMedia, updateMedia } from "@/lib/actions/gallery";

// Albums used as private file stores, never shown in the public gallery.
const NON_GALLERY_ALBUMS = ["avatars", "downloads", "site", "staff"];

export default async function GalleryPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ album?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Media.Upload");
  const { album } = await searchParams;

  const baseWhere = {
    AND: [
      { mimeType: { startsWith: "image/" } },
      { OR: [{ album: null }, { album: { notIn: NON_GALLERY_ALBUMS } }] },
    ],
  };

  const [items, albums] = await Promise.all([
    prisma.mediaItem.findMany({
      where: album ? { AND: [baseWhere, { album }] } : baseWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.mediaItem.findMany({
      where: { AND: [baseWhere, { album: { not: null } }] },
      distinct: ["album"],
      select: { album: true },
    }),
  ]);

  const albumList = Array.from(new Set(albums.map((a) => a.album).filter(Boolean) as string[])).sort();

  return (
    <div>
      <h1 className="text-2xl font-bold">Photo gallery</h1>

      <div className="mt-4">
        <GalleryUploader defaultAlbum={album} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/admin/gallery/photos" className={`rounded px-2 py-1 text-xs ${!album ? "bg-brand-500 text-white" : "bg-slate-100"}`}>All</a>
        {albumList.map((a) => (
          <a key={a} href={`/admin/gallery/photos?album=${encodeURIComponent(a)}`} className={`rounded px-2 py-1 text-xs ${a === album ? "bg-brand-500 text-white" : "bg-slate-100"}`}>{a}</a>
        ))}
      </div>

      <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((m) => (
          <div key={m.id} className="group relative overflow-hidden rounded border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
            <form action={deleteMedia} className="absolute right-1 top-1">
              <input type="hidden" name="id" value={m.id} />
              <button type="submit" className="rounded bg-red-600/90 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100">
                ✕
              </button>
            </form>
            <form action={updateMedia} className="space-y-1 p-2 text-xs">
              <input type="hidden" name="id" value={m.id} />
              <input
                type="text" name="caption" defaultValue={m.caption ?? ""} placeholder="Caption"
                className="w-full rounded border px-1 py-0.5"
              />
              <input
                type="text" name="alt" defaultValue={m.alt ?? ""} placeholder="Alt text (a11y)"
                className="w-full rounded border px-1 py-0.5"
              />
              <input
                type="text" name="album" defaultValue={m.album ?? ""} placeholder="Album"
                className="w-full rounded border px-1 py-0.5"
              />
              <button type="submit" className="w-full rounded bg-slate-100 py-0.5 text-xs hover:bg-slate-200">Save</button>
            </form>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full rounded border bg-white p-6 text-center text-slate-500">No photos yet.</div>
        )}
      </div>
    </div>
  );
}
