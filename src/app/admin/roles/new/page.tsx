import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import RoleForm from "@/components/admin/RoleForm";

export default async function NewRolePage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Roles.Manage");
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
  return (
    <div>
      <h1 className="text-2xl font-bold">New role</h1>
      <div className="mt-6"><RoleForm permissions={permissions} /></div>
    </div>
  );
}
