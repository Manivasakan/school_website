import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isValidLang, t } from "@/lib/i18n";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { embedUrl, type VideoProvider } from "@/lib/youtube";

// Private albums (avatars, downloads, hero image, staff photos) are never
// shown in the public gallery — they're stored in R2 via the same upload
// pipeline but tagged with these album names.
const NON_GALLERY_ALBUMS = ["avatars", "downloads", "site", "staff"];

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ tab?: string; album?: string }>;
}) {
  const { lang } = await params;
  const { tab = "photos", album } = await searchParams;
  if (!isValidLang(lang)) notFound();

  const galleryFilter = {
    AND: [
      { mimeType: { startsWith: "image/" } },
      { OR: [{ album: null }, { album: { notIn: NON_GALLERY_ALBUMS } }] },
    ],
  };

  // Only run the queries needed for the active tab.
  const photosPromise =
    tab === "photos"
      ? prisma.mediaItem.findMany({
          where: album ? { AND: [galleryFilter, { album }] } : galleryFilter,
          orderBy: { createdAt: "desc" },
          take: 120,
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof prisma.mediaItem.findMany>>);

  const videosPromise =
    tab === "videos"
      ? prisma.videoItem.findMany({
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          take: 60,
        })
      : Promise.resolve([] as Awaited<ReturnType<typeof prisma.videoItem.findMany>>);

  const albumsPromise =
    tab === "photos"
      ? prisma.mediaItem.findMany({
          where: { AND: [galleryFilter, { album: { not: null } }] },
          distinct: ["album"],
          select: { album: true },
        })
      : Promise.resolve([] as { album: string | null }[]);

  const [photos, videos, photoAlbums] = await Promise.all([
    photosPromise,
    videosPromise,
    albumsPromise,
  ]);

  const albumList = Array.from(
    new Set(photoAlbums.map((a) => a.album).filter(Boolean) as string[])
  ).sort();

  return (
    <>
      <PublicHeader lang={lang} pathSuffix="/gallery" />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t(lang, "nav.gallery")}</h1>

        <div className="mt-4 flex gap-2 border-b">
          <Link
            href={`/${lang}/gallery?tab=photos`}
            className={`rounded-t px-3 py-2 text-sm ${tab === "photos" ? "bg-white font-medium text-brand-500 border border-b-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Photos
          </Link>
          <Link
            href={`/${lang}/gallery?tab=videos`}
            className={`rounded-t px-3 py-2 text-sm ${tab === "videos" ? "bg-white font-medium text-brand-500 border border-b-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            Videos
          </Link>
        </div>

        {tab === "photos" && (
          <>
            {albumList.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/${lang}/gallery?tab=photos`} className={`rounded px-2 py-1 text-xs ${!album ? "bg-brand-500 text-white" : "bg-slate-100"}`}>All</Link>
                {albumList.map((a) => (
                  <Link key={a} href={`/${lang}/gallery?tab=photos&album=${encodeURIComponent(a)}`} className={`rounded px-2 py-1 text-xs ${a === album ? "bg-brand-500 text-white" : "bg-slate-100"}`}>{a}</Link>
                ))}
              </div>
            )}
            <div className="mt-6 grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((m) => (
                <a key={m.id} href={m.url} target="_blank" rel="noopener" className="overflow-hidden rounded border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.alt ?? ""} loading="lazy" className="aspect-square w-full object-cover transition hover:scale-105" />
                  {m.caption && <div className="p-2 text-xs text-slate-600">{m.caption}</div>}
                </a>
              ))}
              {photos.length === 0 && <p className="col-span-full text-slate-500">No photos yet.</p>}
            </div>
          </>
        )}

        {tab === "videos" && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {videos.map((v) => (
              <figure key={v.id} className="overflow-hidden rounded border bg-white">
                <div className="aspect-video bg-black">
                  <iframe
                    src={embedUrl(v.provider as VideoProvider, v.videoId)}
                    title={v.title || `${v.provider} video`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
                <figcaption className="p-3">
                  {v.title && <div className="font-medium">{v.title}</div>}
                  {v.caption && <div className="mt-1 text-sm text-slate-600">{v.caption}</div>}
                </figcaption>
              </figure>
            ))}
            {videos.length === 0 && <p className="text-slate-500">No videos yet.</p>}
          </div>
        )}
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
