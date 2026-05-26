import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/admin/AdminSidebar";
import LogoutButton from "@/components/admin/LogoutButton";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";

// Admin pages always need the database and the session — never pre-render.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <SessionProvider>
        <div className="min-h-screen bg-slate-50">{children}</div>
      </SessionProvider>
    );
  }

  // Fetch current user for avatar
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatar: true, fullName: true, email: true },
  });

  const initials = (me?.fullName ?? session.user.email ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3">
          <Link href="/admin" className="font-semibold">
            Admin Portal
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin/profile" className="flex items-center gap-2 text-slate-700 hover:text-brand-500">
              {me?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-medium text-white">
                  {initials}
                </span>
              )}
              <span className="hidden text-slate-600 sm:inline">{me?.email ?? session.user.email}</span>
            </Link>
            <LogoutButton />
          </div>
        </header>
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
