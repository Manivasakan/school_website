import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isValidLang } from "@/lib/i18n";
import { newsArticleLd } from "@/lib/jsonld";
import { loadSettings, siteOrigin } from "@/lib/site";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import JsonLd from "@/components/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) return {};
  const news = await prisma.news.findUnique({
    where: { slug },
    include: { translations: { where: { languageCode: lang } } },
  });
  const tr = news?.translations[0];
  if (!tr) return {};
  const description =
    tr.metaDescription ?? tr.body.replace(/<[^>]+>/g, " ").slice(0, 200);
  return {
    title: tr.title,
    description,
    openGraph: {
      type: "article",
      title: tr.title,
      description,
      images: news?.featuredImage ? [news.featuredImage] : undefined,
      publishedTime: news?.publishedAt?.toISOString(),
    },
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) notFound();

  const [news, { get }] = await Promise.all([
    prisma.news.findUnique({
      where: { slug },
      include: { translations: { where: { languageCode: lang } } },
    }),
    loadSettings(),
  ]);

  if (!news || !news.isPublished) notFound();
  const tr = news.translations[0];

  const ld = tr && news.publishedAt
    ? newsArticleLd({
        url: `${siteOrigin()}/${lang}/news/${slug}`,
        headline: tr.title,
        image: news.featuredImage ?? undefined,
        datePublished: news.publishedAt,
        dateModified: news.updatedAt,
        publisherName: get("site.name", "School"),
        publisherLogo: get("home.heroImage") || undefined,
        description: tr.metaDescription ?? undefined,
        inLanguage: lang,
      })
    : null;

  return (
    <>
      {ld && <JsonLd data={ld} />}
      <PublicHeader lang={lang} pathSuffix={`/news/${slug}`} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        {news.publishedAt && (
          <div className="text-sm text-slate-500">
            {news.publishedAt.toLocaleDateString()}
          </div>
        )}
        <h1 className="mt-2 text-3xl font-bold">{tr?.title}</h1>
        {news.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={news.featuredImage}
            alt={tr?.title ?? ""}
            className="mt-6 w-full rounded-lg"
          />
        )}
        <div
          className="prose mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: tr?.body ?? "" }}
        />
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
