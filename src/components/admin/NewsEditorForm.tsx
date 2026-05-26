"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import TranslationTabs from "./TranslationTabs";
import RichTextEditor from "./RichTextEditor";
import { saveNews } from "@/lib/actions/news";

type Lang = { code: string; nativeName: string };

type Translation = { languageCode: string; title: string; body: string };

export default function NewsEditorForm({
  initial,
  languages,
}: {
  initial?: {
    id: string;
    slug: string;
    isPublished: boolean;
    featuredImage: string | null;
    category: string | null;
    translations: Translation[];
  };
  languages: Lang[];
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(initial?.featuredImage ?? null);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [translations, setTranslations] = useState<Record<string, Translation>>(() => {
    const map: Record<string, Translation> = {};
    for (const l of languages) {
      const existing = initial?.translations.find((t) => t.languageCode === l.code);
      map[l.code] = existing ?? { languageCode: l.code, title: "", body: "" };
    }
    return map;
  });

  function updateTr(code: string, field: "title" | "body", value: string) {
    setTranslations((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  }

  return (
    <form action={saveNews}>
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          id: initial?.id,
          slug,
          isPublished,
          featuredImage,
          category: category || null,
          translations: Object.values(translations),
        })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
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
              </div>
            )}
          </TranslationTabs>
        </div>

        <aside className="space-y-4">
          <div className="rounded border bg-white p-4 space-y-3">
            <label className="block">
              <span className="text-sm font-medium">Slug (URL)</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto from title"
                className="mt-1 w-full rounded border px-3 py-2 text-sm font-mono"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Category (optional)</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span className="text-sm">Published</span>
            </label>
          </div>

          <div className="rounded border bg-white p-4">
            <ImageUploader
              value={featuredImage}
              album="news"
              alt="Featured image"
              label="Featured image"
              onUploaded={(url) => setFeaturedImage(url)}
            />
            {featuredImage && (
              <button
                type="button"
                onClick={() => setFeaturedImage(null)}
                className="mt-2 text-xs text-red-600 hover:underline"
              >
                Remove image
              </button>
            )}
          </div>

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
