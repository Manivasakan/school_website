/**
 * URL-safe slug from arbitrary text. Strips non-Latin chars — for Tamil/Sinhala titles
 * users should set the slug manually or we fall back to a short random string.
 */
export function slugify(input: string): string {
  const latin = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  if (latin.length >= 3) return latin;
  return `item-${Math.random().toString(36).slice(2, 8)}`;
}
