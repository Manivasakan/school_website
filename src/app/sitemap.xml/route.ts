import { prisma } from "@/lib/prisma";

export async function GET() {
  const base = process.env.AUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const [languages, pages, news] = await Promise.all([
    prisma.language.findMany({ where: { isEnabled: true } }),
    prisma.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.news.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const urls: string[] = [];
  const staticPaths = ["", "/news", "/events", "/gallery", "/downloads", "/staff", "/contact", "/search"];

  for (const lang of languages) {
    for (const path of staticPaths) {
      urls.push(`${base}/${lang.code}${path}`);
    }
    for (const p of pages) {
      urls.push(`${base}/${lang.code}/p/${p.slug}`);
    }
    for (const n of news) {
      urls.push(`${base}/${lang.code}/news/${n.slug}`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
