import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { getEnabledLanguages } from "@/lib/i18n";
import NewsEditorForm from "@/components/admin/NewsEditorForm";
import { deleteNews } from "@/lib/actions/news";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("News.Edit");
  const { id } = await params;

  const [news, languages] = await Promise.all([
    prisma.news.findUnique({ where: { id }, include: { translations: true } }),
    getEnabledLanguages(),
  ]);
  if (!news) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit article</h1>
        <form action={deleteNews}>
          <input type="hidden" name="id" value={news.id} />
          <button
            type="submit"
            className="text-sm text-red-600 hover:underline"
            onClick={(e) => {
              if (!confirm("Delete this article? This cannot be undone.")) e.preventDefault();
            }}
          >
            Delete
          </button>
        </form>
      </div>
      <div className="mt-6">
        <NewsEditorForm
          initial={{
            id: news.id,
            slug: news.slug,
            isPublished: news.isPublished,
            featuredImage: news.featuredImage,
            category: news.category,
            translations: news.translations.map((t) => ({
              languageCode: t.languageCode,
              title: t.title,
              body: t.body,
            })),
          }}
          languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))}
        />
      </div>
    </div>
  );
}
