"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",  icon: "home"         },
  { href: "/expenses",    label: "Expenses",   icon: "receipt_long" },
  { href: "/categories",  label: "Categories", icon: "label"        },
  { href: "/reports",     label: "Reports",    icon: "bar_chart"    },
  { href: "/settings",    label: "Settings",   icon: "settings"     },
] as const;

function getPageTitle(pathname: string): string {
  return NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.label ?? "Expense Tracker";
}

function UserAvatar({ initials }: { initials: string }) {
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 fixed top-0 left-0 h-full z-40 border-r border-white/10 bg-[rgb(6,6,18)]/80 backdrop-blur-md">

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            ₹
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Expense Tracker</p>
            <p className="text-[10px] text-white/40">Personal Finance</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-2">
            Main Menu
          </p>
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className="material-symbols-rounded text-[20px]">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/10 flex items-center gap-2.5">
          <UserAvatar initials={initials} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-all shrink-0"
          >
            <span className="material-symbols-rounded text-[16px]">logout</span>
          </button>
        </div>
      </aside>

      {/* ── Content area (sidebar-offset on desktop) ─────── */}
      <div className="flex-1 flex flex-col md:ml-[220px]">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[rgb(6,6,18)]/80 backdrop-blur-md sticky top-0 z-30">
          <p className="text-base font-bold text-white">{getPageTitle(pathname)}</p>
          <UserAvatar initials={initials} />
        </header>

        {/* Page content — pb-16 on mobile so bottom nav doesn't overlap */}
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[rgb(6,6,18)]/90 backdrop-blur-md border-t border-white/10 flex items-stretch">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all ${
                  active ? "text-indigo-400" : "text-white/40 hover:text-white/60"
                }`}
              >
                <span className="material-symbols-rounded text-[22px]">{icon}</span>
                {label}
                {active && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
