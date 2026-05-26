"use client";

import { useState } from "react";
import { subscribe } from "@/lib/actions/subscribers";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const fd = new FormData();
    fd.set("email", email);
    const result = await subscribe(fd);
    if (result.ok) {
      setStatus("ok");
      setEmail("");
    } else {
      setError(result.error ?? "Could not subscribe");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return <div className="text-sm text-green-700">Thank you — you're subscribed.</div>;
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 rounded border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {status === "saving" ? "..." : "Subscribe"}
      </button>
      {error && <div className="basis-full text-xs text-red-600">{error}</div>}
    </form>
  );
}
