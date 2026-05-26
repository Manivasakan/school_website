import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isValidLang, t } from "@/lib/i18n";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import NewsCard from "@/components/NewsCard";

export default async function NewsListPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const news = await prisma.news.findMany({
    where: { isPublished: true, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: 30,
    include: { translations: { where: { languageCode: lang } } },
  });

  return (
    <>
      <PublicHeader lang={lang} pathSuffix="/news" />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t(lang, "nav.news")}</h1>
        {news.length === 0 ? (
          <p className="mt-6 text-slate-500">—</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => {
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
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
