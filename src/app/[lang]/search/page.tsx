import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLang } from "@/lib/i18n";
import { siteSearch } from "@/lib/search";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { lang } = await params;
  const { q = "" } = await searchParams;
  if (!isValidLang(lang)) notFound();

  const results = q ? await siteSearch(q, lang) : [];

  return (
    <>
      <PublicHeader lang={lang} pathSuffix={`/search?q=${encodeURIComponent(q)}`} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Search</h1>

        <form className="mt-6" action={`/${lang}/search`}>
          <div className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search news, pages, staff..."
              className="flex-1 rounded border px-4 py-2 text-sm"
              autoFocus
            />
            <button type="submit" className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
              Search
            </button>
          </div>
        </form>

        {q && (
          <div className="mt-8">
            <p className="text-sm text-slate-500">
              {results.length === 0
                ? `No results for "${q}"`
                : `${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`}
            </p>
            <ul className="mt-4 divide-y rounded-lg border bg-white">
              {results.map((r, i) => (
                <li key={i} className="p-4">
                  <div className="text-xs uppercase text-slate-400">{r.type}</div>
                  <Link href={r.url} className="mt-1 block font-medium text-brand-500 hover:underline">
                    {r.title}
                  </Link>
                  {r.snippet && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{r.snippet}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
