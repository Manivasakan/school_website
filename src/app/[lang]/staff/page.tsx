import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isValidLang } from "@/lib/i18n";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import JsonLd from "@/components/JsonLd";
import { siteOrigin, loadSettings } from "@/lib/site";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const [staff, { get }] = await Promise.all([
    prisma.staff.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
      include: { translations: { where: { languageCode: lang } } },
    }),
    loadSettings(),
  ]);

  const orgName = get("site.name", "School");
  const origin = siteOrigin();

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Staff and Faculty",
    itemListElement: staff.map((s, idx) => {
      const tr = s.translations[0];
      const name = tr?.fullName || s.fullName;
      return {
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "Person",
          name,
          jobTitle: tr?.designation || s.designation,
          image: s.photo ?? undefined,
          email: s.email ?? undefined,
          worksFor: { "@type": "EducationalOrganization", name: orgName, url: origin },
        },
      };
    }),
  };

  return (
    <>
      {staff.length > 0 && <JsonLd data={ld} />}
      <PublicHeader lang={lang} pathSuffix="/staff" />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold">Staff & Faculty</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {staff.map((s) => {
            const tr = s.translations[0];
            const name = tr?.fullName || s.fullName;
            const designation = tr?.designation || s.designation;
            const subject = tr?.subject || s.subject;
            return (
              <div key={s.id} className="rounded-lg border bg-white p-4 text-center">
                <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-slate-200">
                  {s.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photo} alt={name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="mt-3 font-medium">{name}</div>
                <div className="text-sm text-slate-600">{designation}</div>
                {subject && <div className="text-xs text-slate-500">{subject}</div>}
                {s.email && (
                  <a href={`mailto:${s.email}`} className="mt-1 block text-xs text-brand-500 hover:underline">
                    {s.email}
                  </a>
                )}
              </div>
            );
          })}
          {staff.length === 0 && (
            <p className="col-span-full text-slate-500">No staff added yet.</p>
          )}
        </div>
      </main>
      <PublicFooter lang={lang} />
    </>
  );
}
