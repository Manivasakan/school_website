import { notFound } from "next/navigation";
import { isValidLang } from "@/lib/i18n";

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

export function generateStaticParams() {
  return [{ lang: "ta" }, { lang: "en" }, { lang: "si" }];
}
