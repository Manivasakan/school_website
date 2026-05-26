import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteDownload } from "@/lib/actions/downloads";

export default async function AdminDownloadsListPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Downloads.Manage");

  const downloads = await prisma.download.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Downloads</h1>
        <Link href="/admin/downloads/new" className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
          + New download
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">Past papers, admission forms, syllabi, term reports.</p>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {downloads.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-2">
                  <a href={d.fileUrl} target="_blank" rel="noopener" className="text-brand-500 hover:underline">{d.title}</a>
                </td>
                <td className="px-4 py-2 text-slate-500">{d.category ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">{d.sizeBytes ? `${Math.round(d.sizeBytes / 1024)} KB` : "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/downloads/${d.id}/edit`} className="text-brand-500 hover:underline">Edit</Link>
                  <form action={deleteDownload} className="ml-3 inline">
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="text-red-600 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {downloads.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No downloads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
