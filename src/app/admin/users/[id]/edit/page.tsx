import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import UserForm from "@/components/admin/UserForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Users.Edit");
  const { id } = await params;
  const [user, roles] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { roles: true } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!user) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold">Edit user</h1>
      <div className="mt-6">
        <UserForm
          initial={{
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            isActive: user.isActive,
            roleIds: user.roles.map((r) => r.roleId),
          }}
          roles={roles}
        />
      </div>
    </div>
  );
}
