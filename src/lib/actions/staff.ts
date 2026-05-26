"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1).max(200),
  designation: z.string().max(200),
  subject: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  photo: z.string().url().optional().nullable().or(z.literal("")),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  translations: z.array(
    z.object({
      languageCode: z.string(),
      fullName: z.string().max(200),
      designation: z.string().max(200),
      subject: z.string().max(200).optional(),
      bio: z.string().max(5000).optional(),
    })
  ).optional(),
});

export async function saveStaff(formData: FormData) {
  await requirePermission("Staff.Manage");
  const raw = formData.get("payload");
  if (typeof raw !== "string") throw new Error("Missing payload");
  const parsed = schema.parse(JSON.parse(raw));

  const data = {
    fullName: parsed.fullName,
    designation: parsed.designation,
    subject: parsed.subject || null,
    email: parsed.email || null,
    photo: parsed.photo || null,
    sortOrder: parsed.sortOrder ?? 0,
    isActive: parsed.isActive ?? true,
  };
  const translations = (parsed.translations ?? []).filter((t) => t.fullName.trim());

  if (parsed.id) {
    await prisma.staff.update({ where: { id: parsed.id }, data });
    await prisma.staffTranslation.deleteMany({ where: { staffId: parsed.id } });
    if (translations.length) {
      await prisma.staffTranslation.createMany({
        data: translations.map((t) => ({
          staffId: parsed.id!,
          languageCode: t.languageCode,
          fullName: t.fullName,
          designation: t.designation,
          subject: t.subject,
          bio: t.bio,
        })),
      });
    }
    await logAudit({ action: "staff.update", entity: "Staff", entityId: parsed.id });
  } else {
    const created = await prisma.staff.create({
      data: { ...data, translations: { create: translations } },
    });
    await logAudit({ action: "staff.create", entity: "Staff", entityId: created.id });
  }

  revalidatePath("/admin/staff");
  revalidatePath("/", "layout");
  redirect("/admin/staff");
}

export async function deleteStaff(formData: FormData) {
  await requirePermission("Staff.Manage");
  const id = String(formData.get("id"));
  await prisma.staff.delete({ where: { id } });
  await logAudit({ action: "staff.delete", entity: "Staff", entityId: id });
  revalidatePath("/admin/staff");
}
