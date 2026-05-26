import { isValidLang, t } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { loadSettings, siteOrigin } from "@/lib/site";
import { organizationLd } from "@/lib/jsonld";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import NewsCard from "@/components/NewsCard";
import JsonLd from "@/components/JsonLd";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const [latestNews, upcomingEvents, settings, principalPage] = await Promise.all([
    prisma.news.findMany({
      where: { isPublished: true, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: { translations: { where: { languageCode: lang } } },
    }),
    prisma.event.findMany({
      where: { isPublished: true, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 4,
      include: { translations: { where: { languageCode: lang } } },
    }),
    loadSettings(),
    prisma.page.findUnique({
      where: { slug: "principal-message" },
      include: { translations: { where: { languageCode: lang } } },
    }),
  ]);
  const get = settings.get;
  const siteName = get("site.name", "School");
  const heroImage = get("home.heroImage");
  const origin = siteOrigin();

  const principalTr = principalPage?.translations[0];
  const principalExcerpt = principalTr?.body
    ? principalTr.body.replace(/<[^>]+>/g, " ").slice(0, 220) + "…"
    : null;

  const yearsOld = get("site.foundedYear")
    ? new Date().getFullYear() - Number(get("site.foundedYear"))
    : null;

  const ld = organizationLd({
    name: siteName,
    url: origin,
    logo: heroImage || undefined,
    description: get("site.tagline"),
    address: get("contact.address"),
    telephone: get("contact.phone"),
    email: get("contact.email"),
    sameAs: [get("social.facebook"), get("social.youtube"), get("social.instagram")].filter(Boolean),
  });

  return (
    <>
      <JsonLd data={ld} />
      <PublicHeader lang={lang} />

      <section
        className="relative bg-gradient-to-br from-brand-700 via-brand-500 to-brand-700 px-4 py-20 text-white"
        style={
          heroImage
            ? {
                backgroundImage: `linear-gradient(rgba(11,20,55,0.6), rgba(11,20,55,0.6)), url(${heroImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">{siteName}</h1>
          <p className="mt-4 text-lg text-brand-100">{get("site.tagline") || t(lang, "home.welcome")}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={`/${lang}/p/admissions`} className="rounded bg-gold-500 px-5 py-2.5 font-medium text-brand-900 hover:bg-gold-400">
              {t(lang, "nav.admissions")}
            </Link>
            <Link href={`/${lang}/news`} className="rounded border border-white/40 px-5 py-2.5 font-medium hover:bg-white/10">
              {t(lang, "home.viewAll")} {t(lang, "nav.news")}
            </Link>
          </div>
        </div>
      </section>

      {(yearsOld || get("site.studentCount")) && (
        <section className="border-b bg-slate-50 px-4 py-8">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 text-center md:grid-cols-3">
            {yearsOld && (
              <div>
                <div className="text-3xl font-bold text-brand-500">{yearsOld}+</div>
                <div className="text-sm uppercase text-slate-500">Years</div>
              </div>
            )}
            {get("site.studentCount") && (
              <div>
                <div className="text-3xl font-bold text-brand-500">{Number(get("site.studentCount")).toLocaleString()}+</div>
                <div className="text-sm uppercase text-slate-500">Students</div>
              </div>
            )}
            <div>
              <div className="text-3xl font-bold text-brand-500">3</div>
              <div className="text-sm uppercase text-slate-500">Languages</div>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-6xl px-4 py-12">
        <section>
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold">{t(lang, "home.latestNews")}</h2>
            <Link href={`/${lang}/news`} className="text-sm text-brand-500 hover:underline">
              {t(lang, "home.viewAll")} →
            </Link>
          </div>
          {latestNews.length === 0 ? (
            <p className="text-slate-500">—</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestNews.map((n) => {
                const tr = n.translations[0];
                if (!tr) return null;
                return (
                  <NewsCard
                    key={n.id}
                    lang={lang}
                    slug={n.slug}
                    title={tr.title}
                    publishedAt={n.publishedAt}
                    featuredImage={n.featuredImage}
                  />
                );
              })}
            </div>
          )}
        </section>

        {principalExcerpt && (
          <section className="mt-16 grid gap-6 md:grid-cols-3 rounded-lg border bg-white p-6">
            <div className="md:col-span-1">
              <div className="text-sm uppercase tracking-wide text-slate-500">{t(lang, "home.principalMessage")}</div>
              <div className="mt-1 text-xl font-semibold">{principalTr?.title ?? ""}</div>
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-700">{principalExcerpt}</p>
              <Link href={`/${lang}/p/principal-message`} className="mt-3 inline-block text-sm text-brand-500 hover:underline">
                {t(lang, "home.readMore")} →
              </Link>
            </div>
          </section>
        )}

        {upcomingEvents.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-2xl font-bold">{t(lang, "home.upcomingEvents")}</h2>
              <Link href={`/${lang}/events`} className="text-sm text-brand-500 hover:underline">
                {t(lang, "home.viewAll")} →
              </Link>
            </div>
            <ul className="divide-y rounded-lg border bg-white">
              {upcomingEvents.map((e) => {
                const tr = e.translations[0];
                if (!tr) return null;
                return (
                  <li key={e.id} className="flex items-center gap-4 p-4">
                    <div className="w-20 shrink-0 text-center">
                      <div className="text-xs uppercase text-slate-500">
                        {e.startsAt.toLocaleString(undefined, { month: "short" })}
                      </div>
                      <div className="text-2xl font-bold">{e.startsAt.getDate()}</div>
                    </div>
                    <div>
                      <div className="font-medium">{tr.title}</div>
                      {e.location && <div className="text-sm text-slate-500">{e.location}</div>}
                    </div>
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
