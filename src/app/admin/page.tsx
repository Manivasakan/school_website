import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  await requirePermission("Dashboard.View");

  const [newsCount, pageCount, userCount, languageCount] = await Promise.all([
    prisma.news.count(),
    prisma.page.count(),
    prisma.user.count(),
    prisma.language.count({ where: { isEnabled: true } }),
  ]);

  const cards = [
    { label: "News articles", value: newsCount },
    { label: "Pages", value: pageCount },
    { label: "Users", value: userCount },
    { label: "Enabled languages", value: languageCount },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Welcome, {session.user.name || session.user.email}.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="text-xs uppercase text-slate-500">{c.label}</div>
            <div className="mt-2 text-3xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border bg-white p-4 text-sm text-slate-700">
        <div className="font-medium">Your permissions</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {(session.user.permissions ?? []).map((p) => (
            <span
              key={p}
              className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
