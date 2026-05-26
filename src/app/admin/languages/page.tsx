import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

async function toggleEnabled(formData: FormData) {
  "use server";
  await requirePermission("Languages.Manage");
  const code = String(formData.get("code"));
  const enabled = formData.get("enabled") === "true";
  await prisma.language.update({
    where: { code },
    data: { isEnabled: !enabled },
  });
  revalidatePath("/admin/languages");
}

async function setDefault(formData: FormData) {
  "use server";
  await requirePermission("Languages.Manage");
  const code = String(formData.get("code"));
  await prisma.$transaction([
    prisma.language.updateMany({ data: { isDefault: false } }),
    prisma.language.update({ where: { code }, data: { isDefault: true, isEnabled: true } }),
  ]);
  revalidatePath("/admin/languages");
}

async function move(formData: FormData) {
  "use server";
  await requirePermission("Languages.Manage");
  const code = String(formData.get("code"));
  const direction = String(formData.get("direction")); // "up" | "down"
  const all = await prisma.language.findMany({ orderBy: { sortOrder: "asc" } });
  const idx = all.findIndex((l) => l.code === code);
  if (idx === -1) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;
  await prisma.$transaction([
    prisma.language.update({
      where: { code: all[idx].code },
      data: { sortOrder: all[swap].sortOrder },
    }),
    prisma.language.update({
      where: { code: all[swap].code },
      data: { sortOrder: all[idx].sortOrder },
    }),
  ]);
  revalidatePath("/admin/languages");
}

export default async function AdminLanguagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Languages.Manage");

  const languages = await prisma.language.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Languages</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enable, reorder, or set the default. The public language switcher hides itself
        when only one language is enabled.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Native</th>
              <th className="px-4 py-2">Enabled</th>
              <th className="px-4 py-2">Default</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {languages.map((lang, idx) => (
              <tr key={lang.code}>
                <td className="px-4 py-2">{lang.sortOrder}</td>
                <td className="px-4 py-2 font-mono text-xs">{lang.code}</td>
                <td className="px-4 py-2">{lang.name}</td>
                <td className="px-4 py-2">{lang.nativeName}</td>
                <td className="px-4 py-2">
                  <form action={toggleEnabled} className="inline">
                    <input type="hidden" name="code" value={lang.code} />
                    <input type="hidden" name="enabled" value={String(lang.isEnabled)} />
                    <button
                      type="submit"
                      className={
                        "rounded px-2 py-0.5 text-xs " +
                        (lang.isEnabled
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-500")
                      }
                    >
                      {lang.isEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2">
                  {lang.isDefault ? (
                    <span className="rounded bg-brand-500 px-2 py-0.5 text-xs text-white">
                      Default
                    </span>
                  ) : (
                    <form action={setDefault} className="inline">
                      <input type="hidden" name="code" value={lang.code} />
                      <button
                        type="submit"
                        className="text-xs text-brand-500 hover:underline"
                      >
                        Make default
                      </button>
                    </form>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={move} className="inline">
                    <input type="hidden" name="code" value={lang.code} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={idx === 0}
                      className="px-1 text-slate-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={move} className="inline">
                    <input type="hidden" name="code" value={lang.code} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={idx === languages.length - 1}
                      className="px-1 text-slate-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
