"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "sent" : "error");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we'll send you a one-hour reset link.
          </p>
        </div>
        {status === "sent" ? (
          <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
            If an account exists for that email, a reset link has been sent.
          </div>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            {status === "error" && (
              <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                Something went wrong. Please try again.
              </div>
            )}
            <button
              type="submit" disabled={status === "sending"}
              className="w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {status === "sending" ? "Sending..." : "Send reset link"}
            </button>
          </>
        )}
        <div className="text-center">
          <Link href="/admin/login" className="text-xs text-slate-500 hover:text-brand-500 hover:underline">
            ← Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
