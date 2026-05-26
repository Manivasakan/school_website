import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export default async function AdminEventsListPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Events.View");

  const events = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
    include: { translations: { where: { languageCode: "en" } } },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/admin/events/new" className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
          + New event
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">Title (EN)</th>
              <th className="px-4 py-2">Starts</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Published</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2">{e.translations[0]?.title ?? <em className="text-slate-400">untitled</em>}</td>
                <td className="px-4 py-2">{e.startsAt.toLocaleString()}</td>
                <td className="px-4 py-2 text-slate-500">{e.location || "—"}</td>
                <td className="px-4 py-2">{e.isPublished ? "Yes" : "No"}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/events/${e.id}/edit`} className="text-brand-500 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No events yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
