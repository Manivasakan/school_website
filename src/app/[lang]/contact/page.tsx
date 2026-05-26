import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isValidLang, t } from "@/lib/i18n";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ContactForm from "@/components/ContactForm";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const settings = await prisma.siteSetting.findMany();
  const get = (k: string) => settings.find((s) => s.key === k)?.value ?? "";
  const waNumber = get("contact.whatsapp").replace(/[^\d]/g, "");

  return (
    <>
      <PublicHeader lang={lang} pathSuffix="/contact" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t(lang, "contact.title")}</h1>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="space-y-3 text-slate-700">
            {get("contact.address") && (
              <div>
                <div className="text-xs uppercase text-slate-500">Address</div>
                <div>{get("contact.address")}</div>
              </div>
            )}
            {get("contact.phone") && (
              <div>
                <div className="text-xs uppercase text-slate-500">Phone</div>
                <a href={`tel:${get("contact.phone")}`} className="text-brand-500 hover:underline">
                  {get("contact.phone")}
                </a>
              </div>
            )}
            {get("contact.email") && (
              <div>
                <div className="text-xs uppercase text-slate-500">Email</div>
                <a href={`mailto:${get("contact.email")}`} className="text-brand-500 hover:underline">
                  {get("contact.email")}
                </a>
              </div>
            )}
            {waNumber && (
              <div>
                <div className="text-xs uppercase text-slate-500">WhatsApp</div>
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-green-700 hover:underline"
                >
                  {get("contact.whatsapp")} →
                </a>
              </div>
            )}
          </div>

          <ContactForm
            labels={{
              name: t(lang, "contact.name"),
              email: t(lang, "contact.email"),
              message: t(lang, "contact.message"),
              send: t(lang, "contact.send"),
            }}
          />
        </div>
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
