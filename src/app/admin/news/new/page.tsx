import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { getEnabledLanguages } from "@/lib/i18n";
import NewsEditorForm from "@/components/admin/NewsEditorForm";

export default async function NewNewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("News.Create");

  const languages = await getEnabledLanguages();

  return (
    <div>
      <h1 className="text-2xl font-bold">New article</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fill in title + body for each enabled language. Untranslated languages are simply
        not shown on the public site.
      </p>
      <div className="mt-6">
        <NewsEditorForm
          languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))}
        />
      </div>
    </div>
  );
}
