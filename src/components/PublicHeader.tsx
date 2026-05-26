import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { t, type Lang, getEnabledLanguages } from "@/lib/i18n";
import { loadSettings } from "@/lib/site";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileNav, { type MobileNavItem } from "./MobileNav";
import SearchBar from "./SearchBar";

export default async function PublicHeader({
  lang,
  pathSuffix,
}: {
  lang: Lang;
  pathSuffix?: string;
}) {
  const [{ get }, navPages, languages] = await Promise.all([
    loadSettings(),
    prisma.page.findMany({
      where: { isPublished: true, showInNav: true },
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { languageCode: lang } } },
      take: 10,
    }),
    getEnabledLanguages(),
  ]);
  const siteName = get("site.name") || "School";

  const items: MobileNavItem[] = [
    { href: `/${lang}`, label: t(lang, "nav.home") },
    ...navPages.map((p) => ({
      href: `/${lang}/p/${p.slug}`,
      label: p.translations[0]?.title ?? p.slug,
    })),
    { href: `/${lang}/news`, label: t(lang, "nav.news") },
    { href: `/${lang}/events`, label: t(lang, "nav.events") },
    { href: `/${lang}/gallery`, label: t(lang, "nav.gallery") },
    { href: `/${lang}/downloads`, label: "Downloads" },
    { href: `/${lang}/staff`, label: "Staff" },
    { href: `/${lang}/contact`, label: t(lang, "nav.contact") },
  ];

  // Reuse the languages we already fetched so LanguageSwitcher doesn't re-query.
  const switcherLangs = languages.map((l) => ({ code: l.code, nativeName: l.nativeName }));

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${lang}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {get("site.shortName") || "S"}
          </div>
          <div>
            <div className="font-semibold leading-tight">{siteName}</div>
            {get("site.tagline") && (
              <div className="hidden text-xs leading-tight text-slate-500 sm:block">
                {get("site.tagline")}
              </div>
            )}
          </div>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-slate-700 hover:text-brand-500"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SearchBar lang={lang} placeholder={t(lang, "common.search") || "Search..."} />
          <div className="hidden lg:block">
            <LanguageSwitcher
              currentLang={lang}
              pathSuffix={pathSuffix}
              languages={switcherLangs}
            />
          </div>
          <MobileNav
            items={items}
            languages={switcherLangs}
            currentLang={lang}
            pathSuffix={pathSuffix}
          />
        </div>
      </div>
    </header>
  );
}
