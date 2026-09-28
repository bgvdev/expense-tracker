"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import Page from "@/components/layout/Page";
import CategoryPanel from "@/components/CategoryPanel";
import CategoryTable from "@/components/CategoryTable";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import StatCard from "@/components/ui/StatCard";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ConfirmDialog, { ConfirmPreview } from "@/components/ui/ConfirmDialog";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import apiFetch from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDate, plural } from "@/lib/format";
import type {
  AdminStats,
  AdminUser,
  AdminCategory,
  ActivityItem,
  NewCategory,
} from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────

const money = (raw: string | number) => formatCurrency(raw, { decimals: false });

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

const TH = "px-5 py-2.5 text-xs font-medium text-muted";

// ── Tab types + config ────────────────────────────────────────────────

type Tab = "overview" | "users" | "categories";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "users", label: "Users", icon: "group" },
  { id: "categories", label: "Categories", icon: "folder" },
];

// ── Overview Tab ──────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<AdminStats>("/api/admin/stats"),
      apiFetch<ActivityItem[]>("/api/admin/activity"),
    ])
      .then(([s, a]) => {
        setStats(s);
        setActivity(a);
      })
      .catch(() => setError("Failed to load admin overview."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}

      {/* 6 stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCard key={i} label="Loading…" value="" loading />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard icon="group" label="Total Users" value={stats.total_users.toLocaleString()} hint="registered" />
          <StatCard icon="person_add" label="New Users" value={stats.new_users_this_month.toLocaleString()} hint="this month" />
          <StatCard icon="receipt_long" label="Total Expenses" value={stats.total_expenses_count.toLocaleString()} hint="all time" />
          <StatCard icon="calendar_month" label="Expenses" value={stats.expenses_this_month_count.toLocaleString()} hint="this month" />
          <StatCard icon="payments" label="Total Spend" value={money(stats.total_expenses_sum)} hint="all time" />
          <StatCard icon="folder" label="Categories" value={stats.total_categories.toLocaleString()} hint="global + user" />
        </div>
      ) : null}

      {/* Recent activity */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Recent Activity"
          description="Last 10 expenses across all users"
          className="border-b border-border"
        />

        {!loading && activity.length === 0 ? (
          <EmptyState icon="receipt_long" title="No expenses yet." />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted">
                    {["User", "Amount", "Category", "Description", "Date"].map((h) => (
                      <th key={h} className={cn(TH, h === "Amount" && "text-right")}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td colSpan={5} className="px-5 py-3">
                            <Skeleton className="h-4" />
                          </td>
                        </tr>
                      ))
                    : activity.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border transition-colors last:border-0 hover:bg-subtle/50"
                        >
                          <td className="px-5 py-3 font-medium text-foreground">{item.user_name}</td>
                          <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground">
                            {money(item.amount)}
                          </td>
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-2">
                              <CategoryIcon icon={item.category_icon} color={item.category_color} size="sm" />
                              <span className="text-muted">{item.category_name}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted">{item.description ?? "—"}</td>
                          <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted">
                            {formatDate(item.spent_at)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <ul className="divide-y divide-border md:hidden">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="space-y-1.5 px-4 py-3">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </li>
                  ))
                : activity.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <CategoryIcon icon={item.category_icon} color={item.category_color} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.user_name}</p>
                        <p className="truncate text-xs text-muted">
                          {item.category_name} · {item.description ?? "—"} · {formatDate(item.spent_at)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {money(item.amount)}
                      </p>
                    </li>
                  ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId: number }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<AdminUser[]>("/api/admin/users")
      .then(setUsers)
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleToggle = async (u: AdminUser) => {
    const newValue = !u.is_admin;
    setToggling(u.id);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_admin: newValue } : x)));
    try {
      await apiFetch(`/api/admin/users/${u.id}/role`, {
        method: "PATCH",
        json: { is_admin: newValue },
      });
      showToast(`${u.name} is now ${newValue ? "an admin" : "a regular user"}.`);
    } catch (err: unknown) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_admin: !newValue } : x)));
      const apiErr = err as { data?: { message?: string } };
      showToast(apiErr?.data?.message ?? "Failed to update role.", "error");
    } finally {
      setToggling(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const RoleBadge = ({ u }: { u: AdminUser }) =>
    u.is_admin ? (
      <Badge tone="accent" icon="shield">
        Admin
      </Badge>
    ) : null;

  const RoleButton = ({ u }: { u: AdminUser }) =>
    u.id === currentUserId ? null : (
      <Button
        size="sm"
        variant={u.is_admin ? "ghost" : "secondary"}
        onClick={() => handleRoleToggle(u)}
        loading={toggling === u.id}
        className={u.is_admin ? "text-danger hover:bg-danger/10 hover:text-danger" : undefined}
      >
        {u.is_admin ? "Revoke Admin" : "Make Admin"}
      </Button>
    );

  const emptyTitle = search ? "No users match your search." : "No users found.";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Users</h2>
          {!loading && <p className="mt-0.5 text-xs text-muted">{plural(users.length, "user")}</p>}
        </div>
        <div className="w-full sm:w-64">
          <Input
            type="text"
            size="sm"
            icon="search"
            placeholder="Search by name or email…"
            aria-label="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="px-5 pt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {!loading && filtered.length === 0 ? (
        <EmptyState icon={search ? "search_off" : "group"} title={emptyTitle} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted">
                  {["#", "Name", "Email", "Joined", "Expenses", "Total Spent", "Role"].map((h) => (
                    <th
                      key={h}
                      className={cn(TH, (h === "Expenses" || h === "Total Spent") && "text-right")}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td colSpan={7} className="px-5 py-3">
                          <Skeleton className="h-4" />
                        </td>
                      </tr>
                    ))
                  : filtered.map((u, idx) => (
                      <tr
                        key={u.id}
                        className="border-b border-border transition-colors last:border-0 hover:bg-subtle/50"
                      >
                        <td className="px-5 py-3 tabular-nums text-faint">{idx + 1}</td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={u.name} size="sm" />
                            <span className="font-medium text-foreground">{u.name}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted">{u.email}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-muted">{formatMonth(u.created_at)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground">
                          {u.expense_count.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground">
                          {money(u.expense_sum)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <RoleBadge u={u} />
                            <RoleButton u={u} />
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="space-y-1.5 px-4 py-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </li>
                ))
              : filtered.map((u) => (
                  <li key={u.id} className="space-y-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                          <p className="mt-0.5 text-xs text-faint">
                            Joined {formatMonth(u.created_at)} · {u.expense_count} expenses ·{" "}
                            <span className="tabular-nums">{money(u.expense_sum)}</span>
                          </p>
                        </div>
                      </div>
                      <RoleBadge u={u} />
                    </div>
                    <div className="pl-11">
                      <RoleButton u={u} />
                    </div>
                  </li>
                ))}
          </ul>
        </>
      )}
    </Card>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────

function CategoriesTab() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<AdminCategory[]>("/api/admin/categories")
      .then(setCategories)
      .catch(() => setError("Failed to load global categories."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: NewCategory) => {
    if (editTarget) {
      await apiFetch(`/api/admin/categories/${editTarget.id}`, {
        method: "PATCH",
        json: data,
      });
      showToast("Category updated.");
    } else {
      await apiFetch("/api/admin/categories", { method: "POST", json: data });
      showToast("Category created.");
    }
    load();
  };

  // Errors propagate to ConfirmDialog, which stays open and shows them.
  const handleDelete = async (cat: AdminCategory) => {
    await apiFetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    showToast(`"${cat.name}" deleted.`);
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
  };

  const openEdit = (cat: AdminCategory) => {
    setEditTarget(cat);
    setPanelOpen(true);
  };

  const openAdd = () => {
    setEditTarget(null);
    setPanelOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader
          title="Default Categories"
          description="Global categories shared with all users"
          className="items-center border-b border-border"
          action={
            <Button size="sm" variant="primary" icon="add" onClick={openAdd}>
              Add Category
            </Button>
          }
        />

        {error && (
          <div className="px-5 pt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        {loading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </li>
            ))}
          </ul>
        ) : categories.length === 0 ? (
          <EmptyState
            icon="folder"
            title="No global categories found."
            action={
              <Button size="sm" icon="add" onClick={openAdd}>
                Add Category
              </Button>
            }
          />
        ) : (
          <CategoryTable
            categories={categories}
            expenseCount={(c) => c.expense_count}
            onEdit={openEdit}
            onDelete={setPendingDelete}
          />
        )}
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => { if (pendingDelete) await handleDelete(pendingDelete); }}
        title="Delete this default category?"
        description="It will be removed for every user. This can't be undone."
      >
        {pendingDelete && (
          <ConfirmPreview
            leading={<CategoryIcon icon={pendingDelete.icon} color={pendingDelete.color} />}
            title={pendingDelete.name}
            subtitle="Global category"
          />
        )}
      </ConfirmDialog>

      <CategoryPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        category={editTarget ?? undefined}
        onSave={handleSave}
      />
    </>
  );
}

// ── Admin content — needs Suspense (useSearchParams) ──────────────────

function AdminContent({ currentUserId }: { currentUserId: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // An unknown ?tab= would otherwise match no panel and render a bare tab bar.
  const requested = searchParams.get("tab");
  const activeTab: Tab = TABS.some((t) => t.id === requested) ? (requested as Tab) : "overview";

  const setTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/admin?${params.toString()}`);
  };

  return (
    <Page>
      <PageHeader
        title="Admin Panel"
        description="Manage users and the default categories shared with everyone."
        actions={
          <span className="hidden sm:block">
            <Badge tone="accent" icon="lock">
              Admin access only
            </Badge>
          </span>
        }
      />

      {/* Tab navigation */}
      <div
        role="tablist"
        aria-label="Admin sections"
        className="mb-6 inline-flex rounded-lg border border-border bg-subtle p-0.5"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              onClick={() => setTab(tab.id)}
              className={cn(
                "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
              )}
            >
              <Icon name={tab.icon} size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "users" && <UsersTab currentUserId={currentUserId} />}
      {activeTab === "categories" && <CategoriesTab />}
    </Page>
  );
}

// ── Page shell ────────────────────────────────────────────────────────

function AdminPageInner() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !user.is_admin) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user?.is_admin) return null;

  return (
    <Suspense
      fallback={
        <Page>
          <Skeleton className="mb-6 h-8 w-40" />
          <Skeleton className="mb-6 h-9 w-72 rounded-lg" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </Page>
      }
    >
      <AdminContent currentUserId={user.id} />
    </Suspense>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <AppShell>
        <AdminPageInner />
      </AppShell>
    </RequireAuth>
  );
}
