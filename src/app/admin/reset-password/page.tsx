"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setStatus("saving");
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      setStatus("ok");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Reset failed. The link may be expired.");
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm rounded-lg border bg-white p-6 text-sm text-slate-700 shadow-sm">
          Missing reset token. Please use the link from your email.
          <div className="mt-3"><Link href="/admin/forgot-password" className="text-brand-500 hover:underline">Request a new link</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Set a new password</h1>
        </div>
        {status === "ok" ? (
          <>
            <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
              Password updated. You can now sign in.
            </div>
            <Link
              href="/admin/login"
              className="block w-full rounded bg-brand-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-600"
            >
              Go to login →
            </Link>
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-medium">New password</span>
              <input
                type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Confirm password</span>
              <input
                type="password" required minLength={8} value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <button
              type="submit" disabled={status === "saving"}
              className="w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {status === "saving" ? "..." : "Set password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
