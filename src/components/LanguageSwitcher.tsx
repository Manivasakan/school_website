import Link from "next/link";
import { getEnabledLanguages } from "@/lib/i18n";

/**
 * Renders the inline language switcher. Accepts `languages` as a prop to allow
 * the parent (e.g. PublicHeader) to reuse a single fetched list across multiple
 * children. If not passed, falls back to a self-query.
 *
 * Hidden entirely if only one language is enabled (per requirements).
 */
export default async function LanguageSwitcher({
  currentLang,
  pathSuffix,
  languages,
}: {
  currentLang: string;
  pathSuffix?: string;
  languages?: { code: string; nativeName: string }[];
}) {
  const langs = languages ?? (await getEnabledLanguages());
  if (langs.length <= 1) return null;

  const suffix = pathSuffix
    ? pathSuffix.startsWith("/")
      ? pathSuffix
      : `/${pathSuffix}`
    : "";

  return (
    <div className="flex items-center gap-1 text-sm">
      {langs.map((lang, idx) => (
        <span key={lang.code} className="flex items-center">
          {idx > 0 && <span className="mx-1 text-slate-400">|</span>}
          <Link
            href={`/${lang.code}${suffix}`}
            className={
              lang.code === currentLang
                ? "font-semibold text-brand-500"
                : "text-slate-600 hover:text-brand-500"
            }
          >
            {lang.nativeName}
          </Link>
        </span>
      ))}
    </div>
  );
}
