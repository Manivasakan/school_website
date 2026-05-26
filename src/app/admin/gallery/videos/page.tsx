import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { addVideo, deleteVideo } from "@/lib/actions/gallery";

export default async function AdminVideosPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Videos.Manage");

  const videos = await prisma.videoItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Video gallery</h1>

      <form action={addVideo} className="mt-4 rounded border bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Video URL (YouTube / Vimeo / Facebook) *</span>
            <input
              type="url" name="url" required
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Title</span>
            <input type="text" name="title" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Album</span>
            <input type="text" name="album" placeholder="e.g. sports-day-2026" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Caption</span>
            <input type="text" name="caption" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
        </div>
        <button type="submit" className="mt-3 rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
          Add video
        </button>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <div key={v.id} className="relative overflow-hidden rounded border bg-white">
            <div className="aspect-video bg-black">
              {v.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
              )}
            </div>
            <div className="p-3">
              <div className="text-sm font-medium">{v.title || `${v.provider} video`}</div>
              <div className="text-xs text-slate-500">{v.provider} · {v.videoId}{v.album ? ` · ${v.album}` : ""}</div>
              {v.caption && <div className="mt-1 text-xs text-slate-600">{v.caption}</div>}
            </div>
            <form action={deleteVideo} className="absolute right-2 top-2">
              <input type="hidden" name="id" value={v.id} />
              <button type="submit" className="rounded bg-red-600/90 px-2 py-0.5 text-xs text-white">✕</button>
            </form>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="col-span-full rounded border bg-white p-6 text-center text-slate-500">No videos yet.</div>
        )}
      </div>
    </div>
  );
}
