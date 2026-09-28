"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: "space_dashboard" },
  { href: "/expenses",   label: "Expenses",   icon: "receipt_long" },
  { href: "/categories", label: "Categories", icon: "label" },
  { href: "/reports",    label: "Reports",    icon: "bar_chart" },
  { href: "/settings",   label: "Settings",   icon: "settings" },
] as const;

const ADMIN_NAV_ITEM = { href: "/admin", label: "Admin", icon: "admin_panel_settings" } as const;

function getPageTitle(pathname: string): string {
  return [...NAV_ITEMS, ADMIN_NAV_ITEM].find((n) => pathname.startsWith(n.href))?.label ?? "Expense Tracker";
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
        ₹
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">Expense Tracker</span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const navItems = user?.is_admin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : [...NAV_ITEMS];

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-14 items-center px-5">
          <Logo />
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {navItems.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-subtle text-foreground"
                    : "text-muted hover:bg-subtle/60 hover:text-foreground",
                )}
              >
                <Icon name={icon} size={19} className={active ? "text-foreground" : "text-faint"} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 border-t border-border px-3 py-3">
          <Avatar name={user?.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <ThemeToggle />
          <IconButton icon="logout" label="Sign out" onClick={handleLogout} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col md:pl-60">
        {/* ── Mobile top bar ── */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur md:hidden">
          <p className="text-base font-semibold tracking-tight text-foreground">{getPageTitle(pathname)}</p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <IconButton icon="logout" label="Sign out" onClick={handleLogout} />
          </div>
        </header>

        {/* pb-20 on mobile so the bottom nav never covers content */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* ── Mobile bottom nav ── */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-surface/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]"
        >
          {navItems.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-foreground" : "text-faint hover:text-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active && "bg-subtle",
                  )}
                >
                  <Icon name={icon} size={20} />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
