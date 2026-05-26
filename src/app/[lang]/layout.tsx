import { notFound } from "next/navigation";
import { isValidLang } from "@/lib/i18n";

// Every page under /[lang] queries the database. Render at request time so
// the build doesn't need DATABASE_URL.
export const dynamic = "force-dynamic";

export default async function PublicLangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();
  return <>{children}</>;
}
