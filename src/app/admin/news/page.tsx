import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export default async function AdminNewsListPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("News.View");

  const news = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { languageCode: "en" } } },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">News</h1>
        <Link
          href="/admin/news/new"
          className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          + New article
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Title (English)</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Published</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {news.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No news yet. Create the first one.
                </td>
              </tr>
            )}
            {news.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-2">
                  {n.translations[0]?.title ?? <em className="text-slate-400">untitled</em>}
                </td>
                <td className="px-4 py-2 text-slate-500">{n.slug}</td>
                <td className="px-4 py-2">
                  {n.isPublished ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      Published
                    </span>
                  ) : (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {n.publishedAt?.toLocaleDateString() ?? "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/news/${n.id}/edit`}
                    className="text-brand-500 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
