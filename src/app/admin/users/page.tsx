import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteUser } from "@/lib/actions/users";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Users.View");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { roles: { include: { role: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link href="/admin/users/new" className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
          + New user
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Roles</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2">{u.fullName}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 text-slate-600">{u.roles.map((r) => r.role.name).join(", ") || "—"}</td>
                <td className="px-4 py-2">{u.isActive ? <span className="text-green-700">Yes</span> : <span className="text-slate-400">No</span>}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/users/${u.id}/edit`} className="text-brand-500 hover:underline">Edit</Link>
                  {u.email !== session.user.email && (
                    <form action={deleteUser} className="ml-3 inline">
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="text-red-600 hover:underline">Delete</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
