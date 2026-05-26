"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export async function saveHeroImage(formData: FormData) {
  await requirePermission("Settings.Edit");
  const value = String(formData.get("value") ?? "");
  await prisma.siteSetting.upsert({
    where: { key: "home.heroImage" },
    create: { key: "home.heroImage", value },
    update: { value },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
