import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("AuditLog.View");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true, fullName: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="mt-1 text-sm text-slate-500">Last 200 actions across the admin portal.</p>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Entity</th>
              <th className="px-4 py-2">Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-xs text-slate-500">{l.createdAt.toLocaleString()}</td>
                <td className="px-4 py-2">{l.user?.email ?? <em className="text-slate-400">system</em>}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-2 text-slate-500">{l.entity ?? "—"}{l.entityId ? ` (${l.entityId.slice(0, 8)}…)` : ""}</td>
                <td className="px-4 py-2 text-xs text-slate-500 max-w-md truncate" title={l.meta ?? undefined}>
                  {l.meta ?? "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No activity yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
