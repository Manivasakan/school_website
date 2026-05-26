import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { getEnabledLanguages } from "@/lib/i18n";
import StaffForm from "@/components/admin/StaffForm";
import { deleteStaff } from "@/lib/actions/staff";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Staff.Manage");
  const { id } = await params;

  const [staff, languages] = await Promise.all([
    prisma.staff.findUnique({ where: { id }, include: { translations: true } }),
    getEnabledLanguages(),
  ]);
  if (!staff) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit staff</h1>
        <form action={deleteStaff}>
          <input type="hidden" name="id" value={staff.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">Delete</button>
        </form>
      </div>
      <div className="mt-6">
        <StaffForm
          initial={{
            id: staff.id,
            fullName: staff.fullName,
            designation: staff.designation,
            subject: staff.subject,
            email: staff.email,
            photo: staff.photo,
            sortOrder: staff.sortOrder,
            isActive: staff.isActive,
            translations: staff.translations.map((t) => ({
              languageCode: t.languageCode,
              fullName: t.fullName,
              designation: t.designation,
              subject: t.subject ?? "",
              bio: t.bio ?? "",
            })),
          }}
          languages={languages.map((l) => ({ code: l.code, nativeName: l.nativeName }))}
        />
      </div>
    </div>
  );
}
