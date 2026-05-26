"use client";

import { useState } from "react";
import TranslationTabs from "./TranslationTabs";
import { saveEvent } from "@/lib/actions/events";

type Lang = { code: string; nativeName: string };
type Translation = { languageCode: string; title: string; description?: string };

/**
 * Convert a Date or ISO string into the value format expected by
 * `<input type="datetime-local">` — local time, no timezone, no seconds.
 * Computed in the BROWSER, so it correctly reflects the admin's timezone.
 */
function toLocalInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local string (browser-local) to a full ISO string with tz. */
function localInputToIso(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function EventForm({
  initial,
  languages,
}: {
  initial?: {
    id: string;
    slug: string;
    /** Pass as ISO string; the form converts to/from browser-local for the input. */
    startsAt: string;
    endsAt: string | null;
    location: string | null;
    isPublished: boolean;
    translations: Translation[];
  };
  languages: Lang[];
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  // Local-time strings shown in the inputs.
  const [startsAtLocal, setStartsAtLocal] = useState(toLocalInput(initial?.startsAt));
  const [endsAtLocal, setEndsAtLocal] = useState(toLocalInput(initial?.endsAt));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [translations, setTranslations] = useState<Record<string, Translation>>(() => {
    const m: Record<string, Translation> = {};
    for (const l of languages) {
      m[l.code] = initial?.translations.find((t) => t.languageCode === l.code) ?? {
        languageCode: l.code, title: "", description: "",
      };
    }
    return m;
  });

  function updateTr(code: string, field: "title" | "description", value: string) {
    setTranslations((p) => ({ ...p, [code]: { ...p[code], [field]: value } }));
  }

  // Send ISO timestamps to the server so it doesn't have to guess the timezone.
  const payload = JSON.stringify({
    id: initial?.id,
    slug,
    startsAt: localInputToIso(startsAtLocal) ?? "",
    endsAt: localInputToIso(endsAtLocal),
    location: location || null,
    isPublished,
    translations: Object.values(translations),
  });

  return (
    <form action={saveEvent}>
      <input type="hidden" name="payload" value={payload} />

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
                <label className="block">
                  <span className="text-sm font-medium">Description (HTML allowed)</span>
                  <textarea
                    rows={6}
                    value={translations[active]?.description ?? ""}
                    onChange={(e) => updateTr(active, "description", e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  />
                </label>
              </div>
            )}
          </TranslationTabs>
        </div>

        <aside className="space-y-3 rounded border bg-white p-4">
          <label className="block">
            <span className="text-sm font-medium">Starts at</span>
            <input
              type="datetime-local"
              required
              value={startsAtLocal}
              onChange={(e) => setStartsAtLocal(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Times use your local timezone (
              {Intl.DateTimeFormat().resolvedOptions().timeZone || "local"}).
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Ends at (optional)</span>
            <input
              type="datetime-local"
              value={endsAtLocal}
              onChange={(e) => setEndsAtLocal(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Location</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Slug</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto"
              className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            <span className="text-sm">Published</span>
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
