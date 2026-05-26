"use client";

import { useState, useRef, useEffect } from "react";

declare global {
  interface Window { turnstile?: any; }
}

export default function ContactForm({
  labels,
}: {
  labels: { name: string; email: string; message: string; send: string };
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    if (!document.getElementById("turnstile-script")) {
      const s = document.createElement("script");
      s.id = "turnstile-script";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    const tick = setInterval(() => {
      if (window.turnstile && widgetRef.current && !widgetRef.current.dataset.rendered) {
        widgetRef.current.dataset.rendered = "1";
        window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          callback: (t: string) => setToken(t),
        });
      }
    }, 200);
    return () => clearInterval(tick);
  }, [siteKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, turnstileToken: token ?? undefined }),
    });
    if (res.ok) {
      setStatus("ok");
      setName(""); setEmail(""); setMessage("");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Send failed");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">Thank you — your message has been sent.</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-white p-4">
      <label className="block">
        <span className="text-sm font-medium">{labels.name}</span>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">{labels.email}</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">{labels.message}</span>
        <textarea rows={4} required value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
      </label>
      {siteKey && <div ref={widgetRef} />}
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
      >
        {status === "sending" ? "..." : labels.send}
      </button>
    </form>
  );
}
