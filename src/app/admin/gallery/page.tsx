import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";

export default async function GalleryHubPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Media.Upload");
  return (
    <div>
      <h1 className="text-2xl font-bold">Gallery</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/gallery/photos" className="rounded-lg border bg-white p-6 hover:shadow">
          <div className="font-semibold">Photos</div>
          <div className="mt-1 text-sm text-slate-500">Bulk upload, organize into albums.</div>
        </Link>
        <Link href="/admin/gallery/videos" className="rounded-lg border bg-white p-6 hover:shadow">
          <div className="font-semibold">Videos</div>
          <div className="mt-1 text-sm text-slate-500">Paste a YouTube / Vimeo / Facebook URL.</div>
        </Link>
      </div>
    </div>
  );
}
