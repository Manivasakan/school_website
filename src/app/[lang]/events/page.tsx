import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isValidLang, t } from "@/lib/i18n";
import { eventLd } from "@/lib/jsonld";
import { siteOrigin } from "@/lib/site";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import JsonLd from "@/components/JsonLd";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { isPublished: true, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      include: { translations: { where: { languageCode: lang } } },
    }),
    prisma.event.findMany({
      where: { isPublished: true, startsAt: { lt: new Date() } },
      orderBy: { startsAt: "desc" },
      take: 20,
      include: { translations: { where: { languageCode: lang } } },
    }),
  ]);

  const origin = siteOrigin();
  const ld = upcoming
    .filter((e) => e.translations[0])
    .map((e) =>
      eventLd({
        name: e.translations[0].title,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        location: e.location,
        description: e.translations[0].description,
        url: `${origin}/${lang}/events#${e.slug}`,
      })
    );

  return (
    <>
      {ld.map((d, i) => <JsonLd key={i} data={d} />)}
      <PublicHeader lang={lang} pathSuffix="/events" />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t(lang, "nav.events")}</h1>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">{t(lang, "home.upcomingEvents")}</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-slate-500">—</p>
          ) : (
            <ul className="mt-4 divide-y rounded-lg border bg-white">
              {upcoming.map((e) => {
                const tr = e.translations[0];
                return (
                  <li key={e.id} id={e.slug} className="flex gap-4 p-4">
                    <div className="w-20 shrink-0 text-center">
                      <div className="text-xs uppercase text-slate-500">{e.startsAt.toLocaleString(undefined, { month: "short" })}</div>
                      <div className="text-2xl font-bold">{e.startsAt.getDate()}</div>
                      <div className="text-xs text-slate-500">{e.startsAt.getFullYear()}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium">{tr?.title}</div>
                      {e.location && <div className="text-sm text-slate-500">{e.location}</div>}
                      {tr?.description && <p className="mt-1 text-sm text-slate-600">{tr.description}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold">Past events</h2>
            <ul className="mt-4 divide-y rounded-lg border bg-white">
              {past.map((e) => {
                const tr = e.translations[0];
                return (
                  <li key={e.id} className="flex justify-between gap-4 p-4">
                    <div>
                      <div className="font-medium">{tr?.title}</div>
                      {e.location && <div className="text-xs text-slate-500">{e.location}</div>}
                    </div>
                    <div className="text-xs text-slate-500">{e.startsAt.toLocaleDateString()}</div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
