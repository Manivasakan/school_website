import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import HeroImageSetting from "@/components/admin/HeroImageSetting";

// Whitelist of editable settings. Anything not in this list is rejected —
// prevents spurious settings from being written to the DB.
const FIELDS = [
  { key: "site.name", label: "Site name" },
  { key: "site.shortName", label: "Short name / acronym" },
  { key: "site.tagline", label: "Tagline" },
  { key: "site.foundedYear", label: "Founded year (for the 'X+ years' stat)" },
  { key: "site.studentCount", label: "Student count (for the 'X+ students' stat)" },
  { key: "contact.address", label: "Address" },
  { key: "contact.phone", label: "Phone" },
  { key: "contact.whatsapp", label: "WhatsApp (with country code)" },
  { key: "contact.email", label: "Email" },
  { key: "social.facebook", label: "Facebook URL" },
  { key: "social.youtube", label: "YouTube URL" },
  { key: "social.instagram", label: "Instagram URL" },
] as const;

const ALLOWED_KEYS = new Set(FIELDS.map((f) => f.key));

async function saveSettings(formData: FormData) {
  "use server";
  await requirePermission("Settings.Edit");
  for (const [key, value] of formData.entries()) {
    if (typeof key !== "string" || !ALLOWED_KEYS.has(key)) continue;
    const v = typeof value === "string" ? value : "";
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: v },
      update: { value: v },
    });
  }
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Settings.Edit");

  const settings = await prisma.siteSetting.findMany();
  const get = (k: string) => settings.find((s) => s.key === k)?.value ?? "";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <HeroImageSetting initial={get("home.heroImage") || null} />

      <form action={saveSettings} className="space-y-4 rounded border bg-white p-4">
        <div className="font-medium">Site details</div>
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-sm font-medium">{f.label}</span>
            <input
              type="text"
              name={f.key}
              defaultValue={get(f.key)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
        ))}
        <button
          type="submit"
          className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Save
        </button>
      </form>
    </div>
  );
}
