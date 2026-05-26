export function GET() {
  const base = process.env.AUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const body = `User-agent: *
Disallow: /admin
Disallow: /api
Allow: /

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=86400" },
  });
}
