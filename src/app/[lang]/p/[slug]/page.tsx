import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isValidLang } from "@/lib/i18n";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) return {};
  const page = await prisma.page.findUnique({
    where: { slug },
    include: { translations: { where: { languageCode: lang } } },
  });
  const tr = page?.translations[0];
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
    },
  };
}

export default async function GenericPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isValidLang(lang)) notFound();
  const page = await prisma.page.findUnique({
    where: { slug },
    include: { translations: { where: { languageCode: lang } } },
  });
  if (!page || !page.isPublished) notFound();
  const tr = page.translations[0];

  return (
    <>
      <PublicHeader lang={lang} pathSuffix={`/p/${slug}`} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">{tr?.title ?? slug}</h1>
        <div className="prose mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: tr?.body ?? "" }} />
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
