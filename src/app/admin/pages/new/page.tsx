import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { getEnabledLanguages } from "@/lib/i18n";
import PageEditorForm from "@/components/admin/PageEditorForm";

export default async function NewPageEditorPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Pages.Create");
  const languages = await getEnabledLanguages();

  return (
    <div>
      <h1 className="text-2xl font-bold">New page</h1>
      <div className="mt-6">
        <PageEditorForm
          languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))}
        />
      </div>
    </div>
  );
}
