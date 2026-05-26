/**
 * Pure-static i18n helpers safe to import from edge contexts (middleware,
 * root layout). NO Prisma/Neon/ws imports here — that would inflate the
 * middleware bundle and break the Edge runtime.
 *
 * Anything DB-backed lives in `./i18n.ts`.
 */
import ta from "@/messages/ta.json";
import en from "@/messages/en.json";
import si from "@/messages/si.json";

export const SUPPORTED_LANGS = ["ta", "en", "si"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const MESSAGES: Record<Lang, Record<string, string>> = { ta, en, si };

export function isValidLang(s: string): s is Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(s);
}

export function t(lang: Lang, key: string, fallback?: string): string {
  return MESSAGES[lang]?.[key] ?? MESSAGES.en[key] ?? fallback ?? key;
}
