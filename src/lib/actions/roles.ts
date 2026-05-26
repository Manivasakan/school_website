"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string()).default([]),
});

export async function saveRole(formData: FormData) {
  await requirePermission("Roles.Manage");
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("Missing payload");
  const parsed = schema.parse(JSON.parse(raw));

  if (parsed.id) {
    const existing = await prisma.role.findUnique({ where: { id: parsed.id } });
    if (existing?.isSystem) {
      // SuperAdmin role: allow renaming description but block permission changes
      // (it has everything and shouldn't be touched).
      await prisma.role.update({
        where: { id: parsed.id },
        data: { description: parsed.description ?? null },
      });
    } else {
      await prisma.role.update({
        where: { id: parsed.id },
        data: { name: parsed.name, description: parsed.description ?? null },
      });
      await prisma.rolePermission.deleteMany({ where: { roleId: parsed.id } });
      if (parsed.permissionIds.length) {
        await prisma.rolePermission.createMany({
          data: parsed.permissionIds.map((permissionId) => ({
            roleId: parsed.id!,
            permissionId,
          })),
        });
      }
    }
    await logAudit({ action: "role.update", entity: "Role", entityId: parsed.id });
  } else {
    const created = await prisma.role.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        permissions: {
          create: parsed.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
    });
    await logAudit({ action: "role.create", entity: "Role", entityId: created.id });
  }

  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}

export async function deleteRole(formData: FormData) {
  await requirePermission("Roles.Manage");
  const id = String(formData.get("id"));
  const role = await prisma.role.findUnique({ where: { id } });
  if (role?.isSystem) throw new Error("System role cannot be deleted");
  await prisma.role.delete({ where: { id } });
  await logAudit({ action: "role.delete", entity: "Role", entityId: id });
  revalidatePath("/admin/roles");
}
