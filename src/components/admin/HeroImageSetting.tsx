"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import { saveHeroImage } from "@/lib/actions/settings";

export default function HeroImageSetting({ initial }: { initial: string | null }) {
  const [value, setValue] = useState<string | null>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "ok">("idle");

  async function persist(url: string | null) {
    setStatus("saving");
    const fd = new FormData();
    if (url) fd.set("value", url);
    await saveHeroImage(fd);
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <div className="rounded border bg-white p-4">
      <div className="text-sm font-medium">Home hero image</div>
      <p className="mt-1 text-xs text-slate-500">
        Background image behind the welcome message on the homepage. Used for Open
        Graph social previews too.
      </p>
      <div className="mt-3">
        <ImageUploader
          value={value}
          album="site"
          alt="Homepage hero"
          label=""
          onUploaded={(url) => {
            setValue(url);
            persist(url);
          }}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue(null);
            persist(null);
          }}
          className="mt-2 text-xs text-red-600 hover:underline"
        >
          Remove hero image
        </button>
      )}
      {status === "ok" && <div className="mt-2 text-xs text-green-700">Saved.</div>}
      {status === "saving" && <div className="mt-2 text-xs text-slate-500">Saving...</div>}
    </div>
  );
}
