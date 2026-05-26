import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { totpUri } from "@/lib/totp";
import {
  changeOwnPassword,
  confirmTotp,
  disableTotp,
  startTotpSetup,
} from "@/lib/actions/security";
import TotpQr from "@/components/admin/TotpQr";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      fullName: true,
      totpEnabled: true,
      totpSecret: true,
    },
  });
  if (!user) redirect("/admin/login");

  const pendingSetup = !user.totpEnabled && Boolean(user.totpSecret);
  const uri = user.totpSecret
    ? totpUri({ secret: user.totpSecret, accountName: user.email })
    : null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className="mt-1 text-sm text-slate-500">{user.fullName} · {user.email}</p>
      </div>

      {/* Change password */}
      <section className="rounded-lg border bg-white p-4">
        <h2 className="font-semibold">Change password</h2>
        <form action={changeOwnPassword} className="mt-3 space-y-3">
          <label className="block">
            <span className="text-sm">Current password</span>
            <input type="password" name="current" required className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm">New password (min 8 chars)</span>
            <input type="password" name="next" required minLength={8} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <button type="submit" className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Update password
          </button>
        </form>
      </section>

      {/* 2FA */}
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Two-factor authentication (2FA)</h2>
          <span className={
            "rounded px-2 py-0.5 text-xs " +
            (user.totpEnabled ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700")
          }>
            {user.totpEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Use any TOTP authenticator app (Google Authenticator, Authy, Microsoft Authenticator, 1Password).
        </p>

        {user.totpEnabled && uri && (
          <form action={disableTotp} className="mt-4 space-y-3">
            <p className="text-sm">To disable 2FA, enter a current code from your authenticator app:</p>
            <input
              type="text" name="code" required pattern="\d{6}" maxLength={6}
              className="w-32 rounded border px-3 py-2 font-mono tracking-widest"
              placeholder="123456"
            />
            <div>
              <button type="submit" className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                Disable 2FA
              </button>
            </div>
          </form>
        )}

        {!user.totpEnabled && !pendingSetup && (
          <form action={startTotpSetup} className="mt-4">
            <button type="submit" className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
              Enable 2FA
            </button>
          </form>
        )}

        {pendingSetup && uri && user.totpSecret && (
          <div className="mt-4 space-y-3">
            <p className="text-sm">1. Scan this QR with your authenticator app:</p>
            <TotpQr uri={uri} />
            <details className="text-xs text-slate-600">
              <summary className="cursor-pointer">Can't scan? Enter this secret manually</summary>
              <code className="mt-1 block break-all rounded bg-slate-100 px-2 py-1">{user.totpSecret}</code>
            </details>
            <form action={confirmTotp} className="space-y-2">
              <label className="block">
                <span className="text-sm">2. Enter the 6-digit code from the app:</span>
                <input
                  type="text" name="code" required pattern="\d{6}" maxLength={6}
                  className="mt-1 w-32 rounded border px-3 py-2 font-mono tracking-widest"
                  placeholder="123456"
                />
              </label>
              <button type="submit" className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                Confirm and enable
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
