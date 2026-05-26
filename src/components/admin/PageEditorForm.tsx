"use client";

import { useState } from "react";
import TranslationTabs from "./TranslationTabs";
import RichTextEditor from "./RichTextEditor";
import { savePage } from "@/lib/actions/pages";

type Lang = { code: string; nativeName: string };
type Translation = { languageCode: string; title: string; body: string; metaDescription?: string };

export default function PageEditorForm({
  initial,
  languages,
}: {
  initial?: {
    id: string;
    slug: string;
    isPublished: boolean;
    showInNav: boolean;
    sortOrder: number;
    translations: Translation[];
  };
  languages: Lang[];
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [showInNav, setShowInNav] = useState(initial?.showInNav ?? false);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [translations, setTranslations] = useState<Record<string, Translation>>(() => {
    const map: Record<string, Translation> = {};
    for (const l of languages) {
      const existing = initial?.translations.find((t) => t.languageCode === l.code);
      map[l.code] = existing ?? { languageCode: l.code, title: "", body: "" };
    }
    return map;
  });

  function updateTr(code: string, field: "title" | "body" | "metaDescription", value: string) {
    setTranslations((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  }

  return (
    <form action={savePage}>
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          id: initial?.id,
          slug,
          isPublished,
          showInNav,
          sortOrder,
          translations: Object.values(translations),
        })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TranslationTabs tabs={languages}>
            {(active) => (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium">Title</span>
                  <input
                    type="text"
                    value={translations[active]?.title ?? ""}
                    onChange={(e) => updateTr(active, "title", e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  />
                </label>
                <div>
                  <div className="mb-1 text-sm font-medium">Body</div>
                  <RichTextEditor
                    value={translations[active]?.body ?? ""}
                    onChange={(html) => updateTr(active, "body", html)}
                  />
                </div>
                <label className="block">
                  <span className="text-sm font-medium">Meta description (SEO)</span>
                  <input
                    type="text"
                    maxLength={300}
                    value={translations[active]?.metaDescription ?? ""}
                    onChange={(e) => updateTr(active, "metaDescription", e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  />
                </label>
              </div>
            )}
          </TranslationTabs>
        </div>

        <aside className="space-y-3 rounded border bg-white p-4">
          <label className="block">
            <span className="text-sm font-medium">Slug</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm"
            />
            <span className="mt-1 block text-xs text-slate-500">Public URL: /[lang]/p/{slug || "..."}</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nav order</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            <span className="text-sm">Published</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showInNav} onChange={(e) => setShowInNav(e.target.checked)} />
            <span className="text-sm">Show in header navigation</span>
          </label>
          <button
            type="submit"
            className="w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Save
          </button>
        </aside>
      </div>
    </form>
  );
}
