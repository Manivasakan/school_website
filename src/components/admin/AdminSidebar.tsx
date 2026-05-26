"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/downloads", label: "Downloads" },
  { href: "/admin/languages", label: "Languages" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/profile", label: "My profile" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r bg-white">
      <nav className="flex flex-col p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "rounded px-3 py-2 text-sm " +
                (active
                  ? "bg-brand-500 font-medium text-white"
                  : "text-slate-700 hover:bg-slate-100")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
