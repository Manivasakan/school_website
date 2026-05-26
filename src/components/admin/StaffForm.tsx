"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import TranslationTabs from "./TranslationTabs";
import { saveStaff } from "@/lib/actions/staff";

type Lang = { code: string; nativeName: string };

type Translation = {
  languageCode: string;
  fullName: string;
  designation: string;
  subject?: string;
  bio?: string;
};

export default function StaffForm({
  initial,
  languages,
}: {
  initial?: {
    id: string;
    fullName: string;
    designation: string;
    subject: string | null;
    email: string | null;
    photo: string | null;
    sortOrder: number;
    isActive: boolean;
    translations: Translation[];
  };
  languages: Lang[];
}) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [designation, setDesignation] = useState(initial?.designation ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [translations, setTranslations] = useState<Record<string, Translation>>(() => {
    const map: Record<string, Translation> = {};
    for (const l of languages) {
      const existing = initial?.translations.find((t) => t.languageCode === l.code);
      map[l.code] = existing ?? {
        languageCode: l.code,
        fullName: "",
        designation: "",
        subject: "",
        bio: "",
      };
    }
    return map;
  });

  function updateTr(code: string, field: keyof Translation, value: string) {
    setTranslations((p) => ({ ...p, [code]: { ...p[code], [field]: value } }));
  }

  return (
    <form action={saveStaff}>
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({
          id: initial?.id,
          fullName,
          designation,
          subject: subject || null,
          email: email || null,
          photo: photo || null,
          sortOrder,
          isActive,
          translations: Object.values(translations),
        })}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-3 rounded border bg-white p-4">
            <div className="text-sm font-medium">Default details (fallback when a language is missing)</div>
            <label className="block">
              <span className="text-sm font-medium">Full name *</span>
              <input
                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Designation *</span>
              <input
                type="text" required value={designation} onChange={(e) => setDesignation(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                placeholder="e.g. Principal, Senior Teacher"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Subject (optional)</span>
                <input
                  type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Email (optional)</span>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Sort order</span>
                <input
                  type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span className="text-sm">Active (shown on site)</span>
              </label>
            </div>
          </div>

          {languages.length > 0 && (
            <div>
              <div className="mb-1 text-sm font-medium">Translations (optional — falls back to defaults above)</div>
              <TranslationTabs tabs={languages}>
                {(active) => (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm font-medium">Full name</span>
                      <input
                        type="text"
                        value={translations[active]?.fullName ?? ""}
                        onChange={(e) => updateTr(active, "fullName", e.target.value)}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium">Designation</span>
                      <input
                        type="text"
                        value={translations[active]?.designation ?? ""}
                        onChange={(e) => updateTr(active, "designation", e.target.value)}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium">Subject</span>
                      <input
                        type="text"
                        value={translations[active]?.subject ?? ""}
                        onChange={(e) => updateTr(active, "subject", e.target.value)}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium">Bio (optional)</span>
                      <textarea
                        rows={4}
                        value={translations[active]?.bio ?? ""}
                        onChange={(e) => updateTr(active, "bio", e.target.value)}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                )}
              </TranslationTabs>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded border bg-white p-4">
            <ImageUploader
              value={photo}
              album="staff"
              alt={fullName}
              label="Photo"
              onUploaded={(url) => setPhoto(url)}
            />
            {photo && (
              <button type="button" onClick={() => setPhoto(null)} className="mt-2 text-xs text-red-600 hover:underline">
                Remove photo
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
