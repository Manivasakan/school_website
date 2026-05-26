import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { removeSubscriber } from "@/lib/actions/subscribers";

/**
 * Escape a CSV cell:
 *  - quote-wrap and double inner quotes
 *  - prefix leading =, +, -, @, tab, CR with a single quote so spreadsheet apps
 *    don't interpret the value as a formula (CSV injection).
 */
function csvCell(v: string): string {
  let s = v ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export default async function AdminSubscribersPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Settings.Edit");

  const subs = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const csv =
    "data:text/csv;charset=utf-8," +
    encodeURIComponent(
      "email,name,subscribed_at\n" +
        subs
          .map((s) =>
            [csvCell(s.email), csvCell(s.name ?? ""), s.createdAt.toISOString()].join(",")
          )
          .join("\n")
    );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Newsletter subscribers</h1>
        <a href={csv} download="subscribers.csv" className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50">
          Export CSV
        </a>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Collected via the footer form. {subs.length} subscriber{subs.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Subscribed</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2 text-slate-600">{s.name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">{s.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  <form action={removeSubscriber} className="inline">
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="text-red-600 hover:underline">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No subscribers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
