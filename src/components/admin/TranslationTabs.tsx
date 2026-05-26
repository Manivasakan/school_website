"use client";

import { useState } from "react";

export type LangTab = { code: string; nativeName: string };

/**
 * Tab UI for editing translations. Renders ONE pane visible at a time;
 * children() is invoked with the active language code so the parent can
 * render the right textarea/input set. Hidden languages still exist in the
 * DOM with `display:none` so form values are submitted on form submit.
 */
export default function TranslationTabs({
  tabs,
  children,
  defaultCode,
}: {
  tabs: LangTab[];
  defaultCode?: string;
  children: (active: string, allCodes: string[]) => React.ReactNode;
}) {
  const initial = defaultCode || tabs[0]?.code || "en";
  const [active, setActive] = useState(initial);

  return (
    <div>
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setActive(t.code)}
            className={
              "rounded-t px-3 py-1.5 text-sm " +
              (active === t.code
                ? "bg-white font-medium text-brand-500 border border-b-white"
                : "text-slate-600 hover:bg-slate-100")
            }
          >
            {t.nativeName}
          </button>
        ))}
      </div>
      <div className="rounded-b border border-t-0 bg-white p-4">
        {children(active, tabs.map((t) => t.code))}
      </div>
    </div>
  );
}
