import { t, type Lang } from "@/lib/i18n";
import { loadSettings } from "@/lib/site";
import NewsletterForm from "./NewsletterForm";
import Link from "next/link";

export default async function PublicFooter({ lang }: { lang: Lang }) {
  const { get } = await loadSettings();

  return (
    <footer className="mt-16 border-t bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="font-semibold">{get("site.name") || "School"}</div>
          {get("site.tagline") && (
            <div className="mt-1 text-sm text-slate-500">{get("site.tagline")}</div>
          )}
        </div>
        <div className="text-sm text-slate-600">
          <div className="mb-1 text-xs uppercase text-slate-500">Contact</div>
          <div>{get("contact.address")}</div>
          {get("contact.phone") && (
            <a href={`tel:${get("contact.phone")}`} className="block hover:text-brand-500">
              {get("contact.phone")}
            </a>
          )}
          {get("contact.email") && (
            <a href={`mailto:${get("contact.email")}`} className="block hover:text-brand-500">
              {get("contact.email")}
            </a>
          )}
        </div>
        <div className="text-sm">
          <div className="mb-1 text-xs uppercase text-slate-500">Follow us</div>
          <div className="flex flex-col gap-1">
            {get("social.facebook") && (
              <a href={get("social.facebook")} target="_blank" rel="noopener" className="hover:text-brand-500">Facebook</a>
            )}
            {get("social.youtube") && (
              <a href={get("social.youtube")} target="_blank" rel="noopener" className="hover:text-brand-500">YouTube</a>
            )}
            {get("social.instagram") && (
              <a href={get("social.instagram")} target="_blank" rel="noopener" className="hover:text-brand-500">Instagram</a>
            )}
          </div>
          <div className="mt-3">
            <Link href={`/${lang}/p/accessibility`} className="text-xs text-slate-500 hover:text-brand-500 hover:underline">
              Accessibility
            </Link>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs uppercase text-slate-500">Newsletter</div>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t bg-white py-3 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {get("site.name") || "School"} — {t(lang, "footer.rights")}
      </div>
    </footer>
  );
}
