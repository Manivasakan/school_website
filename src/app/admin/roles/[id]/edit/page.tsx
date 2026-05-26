import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import RoleForm from "@/components/admin/RoleForm";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Roles.Manage");
  const { id } = await params;
  const [role, permissions] = await Promise.all([
    prisma.role.findUnique({ where: { id }, include: { permissions: true } }),
    prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] }),
  ]);
  if (!role) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold">Edit role</h1>
      <div className="mt-6">
        <RoleForm
          initial={{
            id: role.id,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            permissionIds: role.permissions.map((p) => p.permissionId),
          }}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
