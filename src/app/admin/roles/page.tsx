import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteRole } from "@/lib/actions/roles";

export default async function AdminRolesPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Roles.View");

  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: { permissions: { include: { permission: true } }, users: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Link
          href="/admin/roles/new"
          className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          + New role
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {role.name}
                  {role.isSystem && (
                    <span className="ml-2 rounded bg-brand-500 px-2 py-0.5 text-xs text-white">system</span>
                  )}
                </div>
                {role.description && <div className="text-sm text-slate-500">{role.description}</div>}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">
                  {role.permissions.length} perms · {role.users.length} users
                </span>
                <Link href={`/admin/roles/${role.id}/edit`} className="text-brand-500 hover:underline">
                  Edit
                </Link>
                {!role.isSystem && (
                  <form action={deleteRole} className="inline">
                    <input type="hidden" name="id" value={role.id} />
                    <button type="submit" className="text-red-600 hover:underline">Delete</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
