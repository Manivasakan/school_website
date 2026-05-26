import Link from "next/link";
import { headers } from "next/headers";
import { SUPPORTED_LANGS } from "@/lib/i18n-static";

export default async function LangNotFound() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "/";
  const seg = pathname.split("/")[1] || "";
  const lang = (SUPPORTED_LANGS as readonly string[]).includes(seg) ? seg : "en";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="text-7xl font-bold text-brand-500">404</div>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <Link
        href={`/${lang}`}
        className="mt-6 rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        Home →
      </Link>
    </div>
  );
}
