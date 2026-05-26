import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { getEnabledLanguages } from "@/lib/i18n";
import PageEditorForm from "@/components/admin/PageEditorForm";
import { deletePage } from "@/lib/actions/pages";

export default async function EditPageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Pages.Edit");
  const { id } = await params;

  const [page, languages] = await Promise.all([
    prisma.page.findUnique({ where: { id }, include: { translations: true } }),
    getEnabledLanguages(),
  ]);
  if (!page) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit page</h1>
        <form action={deletePage}>
          <input type="hidden" name="id" value={page.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">Delete</button>
        </form>
      </div>
      <div className="mt-6">
        <PageEditorForm
          initial={{
            id: page.id,
            slug: page.slug,
            isPublished: page.isPublished,
            showInNav: page.showInNav,
            sortOrder: page.sortOrder,
            translations: page.translations.map((t) => ({
              languageCode: t.languageCode,
              title: t.title,
              body: t.body,
              metaDescription: t.metaDescription ?? undefined,
            })),
          }}
          languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))}
        />
      </div>
    </div>
  );
}
