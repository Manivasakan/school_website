import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { getEnabledLanguages } from "@/lib/i18n";
import StaffForm from "@/components/admin/StaffForm";

export default async function NewStaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Staff.Manage");
  const languages = await getEnabledLanguages();
  return (
    <div>
      <h1 className="text-2xl font-bold">New staff member</h1>
      <div className="mt-6">
        <StaffForm
          languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))}
        />
      </div>
    </div>
  );
}
