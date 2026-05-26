"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission, getSessionUser } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/brevo";
import { siteOrigin } from "@/lib/site";

const createSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  avatar: z.string().url().nullable().optional(),
  password: z.string().min(8).max(100),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string()).default([]),
});

const updateSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1).max(200),
  avatar: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string()).default([]),
  password: z.string().min(8).max(100).optional().or(z.literal("")),
});

/**
 * Returns true if the actor is permitted to assign the given roles.
 * Rules:
 *  - To assign roles at all: must have Roles.Manage OR Users.Edit.
 *  - SuperAdmin (system) role can only be assigned/revoked by an existing SuperAdmin.
 */
async function canAssignRoles(actorRoles: string[], targetRoleIds: string[]): Promise<boolean> {
  if (targetRoleIds.length === 0) return true;
  const target = await prisma.role.findMany({
    where: { id: { in: targetRoleIds } },
    select: { isSystem: true },
  });
  const includesSystem = target.some((r) => r.isSystem);
  if (includesSystem && !actorRoles.includes("SuperAdmin")) return false;
  return true;
}

export async function createUser(formData: FormData) {
  await requirePermission("Users.Create");
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("Missing payload");
  const result = createSchema.safeParse(safeJson(raw));
  if (!result.success) throw new Error("Invalid input");
  const parsed = result.data;

  const actor = await getSessionUser();
  if (!actor) throw new Error("Unauthorized");
  if (!(await canAssignRoles(actor.roles ?? [], parsed.roleIds))) {
    throw new Error("You can't assign the SuperAdmin role");
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      fullName: parsed.fullName,
      avatar: parsed.avatar ?? null,
      passwordHash,
      isActive: parsed.isActive ?? true,
      roles: { create: parsed.roleIds.map((roleId) => ({ roleId })) },
    },
  });
  await logAudit({ action: "user.create", entity: "User", entityId: user.id });

  try {
    const loginUrl = `${siteOrigin()}/admin/login`;
    const resetUrl = `${siteOrigin()}/admin/forgot-password`;
    await sendEmail({
      to: [{ email: user.email, name: user.fullName }],
      subject: "Welcome to the school admin portal",
      htmlContent: `<p>Hi ${escapeHtml(user.fullName)},</p>
<p>An account has been created for you on the school admin portal.</p>
<p><strong>Sign in:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
<p>For security, change your password on first login. If you didn't receive a password, you can reset it here: <a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  } catch (e) {
    console.error("welcome email failed:", e);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUser(formData: FormData) {
  await requirePermission("Users.Edit");
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("Missing payload");
  const result = updateSchema.safeParse(safeJson(raw));
  if (!result.success) throw new Error("Invalid input");
  const parsed = result.data;

  const actor = await getSessionUser();
  if (!actor) throw new Error("Unauthorized");

  // Block privilege escalation: SuperAdmin role can only be granted by SuperAdmin.
  if (!(await canAssignRoles(actor.roles ?? [], parsed.roleIds))) {
    throw new Error("You can't assign the SuperAdmin role");
  }

  // Also block editing a SuperAdmin if the actor isn't one.
  const target = await prisma.user.findUnique({
    where: { id: parsed.id },
    include: { roles: { include: { role: true } } },
  });
  if (!target) throw new Error("User not found");
  const targetIsSuperAdmin = target.roles.some((r) => r.role.name === "SuperAdmin");
  if (targetIsSuperAdmin && !actor.roles?.includes("SuperAdmin")) {
    throw new Error("Only a SuperAdmin can edit another SuperAdmin");
  }

  const data: any = {
    fullName: parsed.fullName,
    avatar: parsed.avatar ?? null,
    isActive: parsed.isActive ?? true,
  };
  if (parsed.password) {
    data.passwordHash = await bcrypt.hash(parsed.password, 10);
  }
  await prisma.user.update({ where: { id: parsed.id }, data });

  await prisma.userRole.deleteMany({ where: { userId: parsed.id } });
  if (parsed.roleIds.length) {
    await prisma.userRole.createMany({
      data: parsed.roleIds.map((roleId) => ({ userId: parsed.id, roleId })),
    });
  }
  await logAudit({ action: "user.update", entity: "User", entityId: parsed.id });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(formData: FormData) {
  await requirePermission("Users.Delete");
  const id = String(formData.get("id"));
  const actor = await getSessionUser();
  if (!actor) throw new Error("Unauthorized");

  if (id === actor.id) throw new Error("You cannot delete your own account");

  const target = await prisma.user.findUnique({
    where: { id },
    include: { roles: { include: { role: true } } },
  });
  if (!target) return;

  const targetIsSuperAdmin = target.roles.some((r) => r.role.name === "SuperAdmin");
  if (targetIsSuperAdmin) {
    if (!actor.roles?.includes("SuperAdmin")) {
      throw new Error("Only a SuperAdmin can delete another SuperAdmin");
    }
    // Don't allow deleting the last active SuperAdmin
    const otherActiveSuperAdmins = await prisma.user.count({
      where: {
        id: { not: id },
        isActive: true,
        roles: { some: { role: { name: "SuperAdmin" } } },
      },
    });
    if (otherActiveSuperAdmins === 0) {
      throw new Error("Cannot delete the last active SuperAdmin");
    }
  }

  await prisma.user.delete({ where: { id } });
  await logAudit({ action: "user.delete", entity: "User", entityId: id });
  revalidatePath("/admin/users");
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function escapeHtml(s: string) {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!));
}
