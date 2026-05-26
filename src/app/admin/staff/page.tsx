import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export default async function AdminStaffListPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Staff.View");

  const staff = await prisma.staff.findMany({
    orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff / Faculty</h1>
        <Link href="/admin/staff/new" className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
          + New staff member
        </Link>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => (
          <Link
            key={s.id}
            href={`/admin/staff/${s.id}/edit`}
            className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:shadow-sm"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200">
              {s.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photo} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{s.fullName}</div>
              <div className="truncate text-sm text-slate-500">{s.designation}</div>
              {!s.isActive && <div className="text-xs text-amber-700">Inactive</div>}
            </div>
          </Link>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full rounded border bg-white p-6 text-center text-slate-500">No staff yet.</div>
        )}
      </div>
    </div>
  );
}
