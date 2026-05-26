import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isValidLang } from "@/lib/i18n";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default async function DownloadsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const downloads = await prisma.download.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  // Group by category
  const groups = new Map<string, typeof downloads>();
  for (const d of downloads) {
    const key = d.category ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  return (
    <>
      <PublicHeader lang={lang} pathSuffix="/downloads" />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">Downloads</h1>
        <p className="mt-1 text-sm text-slate-500">Past papers, admission forms, syllabi.</p>

        {downloads.length === 0 ? (
          <p className="mt-6 text-slate-500">No downloads yet.</p>
        ) : (
          <div className="mt-8 space-y-6">
            {Array.from(groups.entries()).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-xl font-semibold">{category}</h2>
                <ul className="mt-3 divide-y rounded-lg border bg-white">
                  {items.map((d) => (
                    <li key={d.id} className="flex items-center justify-between p-3">
                      <div>
                        <a href={d.fileUrl} target="_blank" rel="noopener" className="font-medium text-brand-500 hover:underline">
                          {d.title}
                        </a>
                        {d.description && <div className="text-sm text-slate-500">{d.description}</div>}
                      </div>
                      <div className="text-xs text-slate-500">
                        {d.sizeBytes ? `${Math.round(d.sizeBytes / 1024)} KB` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
