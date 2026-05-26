"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showTotp, setShowTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      totp: totp || undefined,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      // We can't distinguish "wrong password" from "wrong TOTP" without weakening
      // the auth contract, so reveal the TOTP field after the first failure as a hint.
      if (!showTotp) setShowTotp(true);
      setError("Invalid email, password, or 2FA code.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold">Admin Login</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage the school website.</p>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <div>
          {!showTotp ? (
            <button
              type="button"
              onClick={() => setShowTotp(true)}
              className="text-xs text-slate-500 hover:text-brand-500 hover:underline"
            >
              Have 2FA enabled? Enter your code →
            </button>
          ) : (
            <label className="block">
              <span className="text-sm font-medium">2FA code (only if enabled)</span>
              <input
                type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                autoComplete="one-time-code"
                value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                className="mt-1 w-full rounded border px-3 py-2 text-sm font-mono tracking-widest"
                placeholder="123456"
              />
            </label>
          )}
        </div>

        {error && (
          <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="text-center">
          <Link href="/admin/forgot-password" className="text-xs text-slate-500 hover:text-brand-500 hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
