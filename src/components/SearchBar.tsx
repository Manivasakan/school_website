"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ lang, placeholder }: { lang: string; placeholder?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/${lang}/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="hidden md:block"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? "Search..."}
        className="w-48 rounded border px-3 py-1 text-sm"
      />
    </form>
  );
}
