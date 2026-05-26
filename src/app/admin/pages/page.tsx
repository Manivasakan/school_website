import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export default async function AdminPagesListPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Pages.View");

  const pages = await prisma.page.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { translations: { where: { languageCode: "en" } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pages</h1>
        <Link
          href="/admin/pages/new"
          className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          + New page
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Title (EN)</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">In nav</th>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pages.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">{p.translations[0]?.title ?? <em className="text-slate-400">untitled</em>}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{p.slug}</td>
                <td className="px-4 py-2">{p.showInNav ? "Yes" : "—"}</td>
                <td className="px-4 py-2">{p.sortOrder}</td>
                <td className="px-4 py-2">
                  {p.isPublished ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Published</span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">Draft</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/pages/${p.id}/edit`} className="text-brand-500 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No pages yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
