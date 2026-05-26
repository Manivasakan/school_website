import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import UserForm from "@/components/admin/UserForm";

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Users.Create");
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">New user</h1>
      <div className="mt-6"><UserForm roles={roles} /></div>
    </div>
  );
}
