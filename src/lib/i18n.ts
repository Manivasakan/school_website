import { cache } from "react";
import { prisma } from "./prisma";
import { SUPPORTED_LANGS, isValidLang, type Lang } from "./i18n-static";

// Re-export the pure helpers so existing server-component imports keep working.
export { SUPPORTED_LANGS, isValidLang, t } from "./i18n-static";
export type { Lang } from "./i18n-static";

/**
 * Load enabled languages from DB, ordered by sortOrder.
 * Wrapped in React's `cache()` so PublicHeader + LanguageSwitcher dedupe to one
 * query per render. Server-side only — do not import from edge bundles.
 */
export const getEnabledLanguages = cache(async () => {
  return prisma.language.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: "asc" },
  });
});

export async function getDefaultLanguageCode(): Promise<Lang> {
  const def = await prisma.language.findFirst({
    where: { isEnabled: true, isDefault: true },
  });
  if (def && isValidLang(def.code)) return def.code;
  const first = await prisma.language.findFirst({
    where: { isEnabled: true },
    orderBy: { sortOrder: "asc" },
  });
  if (first && isValidLang(first.code)) return first.code;
  return "ta";
}
