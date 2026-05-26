import { prisma } from "./prisma";

export type SearchResult = {
  type: "news" | "page" | "staff";
  url: string;
  title: string;
  snippet?: string;
};

/**
 * Site-wide search across news titles+bodies, page titles+bodies, and staff names.
 * Uses Postgres ILIKE — fine for a school with <10k records. For larger sites
 * upgrade to FTS (tsvector + tsquery) or a search service.
 */
export async function siteSearch(q: string, lang: string, limit = 30): Promise<SearchResult[]> {
  const term = q.trim();
  if (term.length < 2) return [];

  const [news, pages, staff] = await Promise.all([
    prisma.newsTranslation.findMany({
      where: {
        languageCode: lang,
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { body: { contains: term, mode: "insensitive" } },
        ],
        news: { isPublished: true },
      },
      take: limit,
      include: { news: { select: { slug: true, publishedAt: true } } },
    }),
    prisma.pageTranslation.findMany({
      where: {
        languageCode: lang,
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { body: { contains: term, mode: "insensitive" } },
        ],
        page: { isPublished: true },
      },
      take: limit,
      include: { page: { select: { slug: true } } },
    }),
    prisma.staff.findMany({
      where: {
        isActive: true,
        OR: [
          { fullName: { contains: term, mode: "insensitive" } },
          { designation: { contains: term, mode: "insensitive" } },
          { subject: { contains: term, mode: "insensitive" } },
        ],
      },
      take: limit,
    }),
  ]);

  const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const results: SearchResult[] = [
    ...news.map((n): SearchResult => ({
      type: "news",
      url: `/${lang}/news/${n.news.slug}`,
      title: n.title,
      snippet: stripHtml(n.body).slice(0, 200),
    })),
    ...pages.map((p): SearchResult => ({
      type: "page",
      url: `/${lang}/p/${p.page.slug}`,
      title: p.title,
      snippet: stripHtml(p.body).slice(0, 200),
    })),
    ...staff.map((s): SearchResult => ({
      type: "staff",
      url: `/${lang}/staff`,
      title: s.fullName,
      snippet: [s.designation, s.subject].filter(Boolean).join(" · "),
    })),
  ];

  // Naive ranking: title matches first
  const lc = term.toLowerCase();
  results.sort((a, b) => {
    const at = a.title.toLowerCase().includes(lc) ? 0 : 1;
    const bt = b.title.toLowerCase().includes(lc) ? 0 : 1;
    return at - bt;
  });

  return results.slice(0, limit);
}
