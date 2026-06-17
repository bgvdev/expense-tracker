"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import CategoryModal from "@/components/CategoryModal";
import apiFetch from "@/lib/api";
import type {
  AdminStats,
  AdminUser,
  AdminCategory,
  ActivityItem,
  NewCategory,
} from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────

function formatCurrency(raw: string | number) {
  return "₹" + Number(raw).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

// ── StatCard ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-5 flex flex-col gap-2">
      <span className="material-symbols-rounded text-[22px] text-indigo-400">{icon}</span>
      <p className="text-2xl font-bold text-white">{value}</p>
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-xs text-white/40">{sub}</p>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    Promise.all([
      apiFetch<AdminStats>("/api/admin/stats"),
      apiFetch<ActivityItem[]>("/api/admin/activity"),
    ])
      .then(([s, a]) => {
        setStats(s);
        setActivity(a);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* 6 stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/5 border border-white/10 px-5 py-5 animate-pulse h-28"
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon="group"
            label="Total Users"
            value={stats.total_users.toLocaleString()}
            sub="registered"
          />
          <StatCard
            icon="person_add"
            label="New Users"
            value={stats.new_users_this_month.toLocaleString()}
            sub="this month"
          />
          <StatCard
            icon="receipt_long"
            label="Total Expenses"
            value={stats.total_expenses_count.toLocaleString()}
            sub="all time"
          />
          <StatCard
            icon="calendar_month"
            label="Expenses"
            value={stats.expenses_this_month_count.toLocaleString()}
            sub="this month"
          />
          <StatCard
            icon="payments"
            label="Total Spend"
            value={formatCurrency(stats.total_expenses_sum)}
            sub="all time"
          />
          <StatCard
            icon="folder"
            label="Categories"
            value={stats.total_categories.toLocaleString()}
            sub="global + user"
          />
        </div>
      ) : null}

      {/* Recent activity table */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-semibold text-white">Recent Activity</p>
          <p className="text-xs text-white/40 mt-0.5">Last 10 expenses across all users</p>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {["User", "Amount", "Category", "Description", "Date"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={5} className="px-5 py-3">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : activity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-white/30 text-sm">
                    No expenses yet.
                  </td>
                </tr>
              ) : (
                activity.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-white">{item.user_name}</td>
                    <td className="px-5 py-3 text-emerald-400 font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="material-symbols-rounded text-[14px]"
                          style={{ color: item.category_color }}
                        >
                          {item.category_icon}
                        </span>
                        <span className="text-white/70">{item.category_name}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/50">{item.description ?? "—"}</td>
                    <td className="px-5 py-3 text-white/40">{formatDate(item.spent_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-white/5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5 animate-pulse">
                <div className="h-3 bg-white/10 rounded w-32" />
                <div className="h-3 bg-white/5 rounded w-48" />
              </div>
            ))
          ) : activity.length === 0 ? (
            <p className="px-4 py-8 text-center text-white/30 text-sm">No expenses yet.</p>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="material-symbols-rounded text-[13px]"
                      style={{ color: item.category_color }}
                    >
                      {item.category_icon}
                    </span>
                    <span className="text-xs text-white/50 truncate">{item.category_name}</span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{item.user_name}</p>
                  <p className="text-xs text-white/30">
                    {item.description ?? "—"} · {formatDate(item.spent_at)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-emerald-400">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId: number }) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<AdminUser[]>("/api/admin/users")
      .then(setUsers)
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
      <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs px-2 py-0.5">
        <span className="material-symbols-rounded text-[12px]">shield</span>
        Admin
      </span>
    ) : null;

  const RoleButton = ({ u }: { u: AdminUser }) =>
    u.id === currentUserId ? null : (
      <button
        onClick={() => handleRoleToggle(u)}
        disabled={toggling === u.id}
        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all disabled:opacity-50 ${
          u.is_admin
            ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
            : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
        }`}
      >
        {toggling === u.id ? "…" : u.is_admin ? "Revoke Admin" : "Make Admin"}
      </button>
    );

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
        <p className="text-sm font-semibold text-white">Users</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-[16px] text-white/30">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all w-full sm:w-64"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["#", "Name", "Email", "Joined", "Expenses", "Total Spent", "Role"].map((h) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider ${
                    h === "Expenses" || h === "Total Spent" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={7} className="px-5 py-3">
                    <div className="h-4 bg-white/5 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-white/30 text-sm">
                  {search ? "No users match your search." : "No users found."}
                </td>
              </tr>
            ) : (
              filtered.map((u, idx) => (
                <tr
                  key={u.id}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-5 py-3 text-white/30">{idx + 1}</td>
                  <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                  <td className="px-5 py-3 text-white/60">{u.email}</td>
                  <td className="px-5 py-3 text-white/40">{formatMonth(u.created_at)}</td>
                  <td className="px-5 py-3 text-right text-white/70">
                    {u.expense_count.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-white/70">
                    {formatCurrency(u.expense_sum)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <RoleBadge u={u} />
                      <RoleButton u={u} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-white/5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3 space-y-1.5 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-32" />
              <div className="h-3 bg-white/5 rounded w-48" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-white/30 text-sm">
            {search ? "No users match your search." : "No users found."}
          </p>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-white/50 truncate">{u.email}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    Joined {formatMonth(u.created_at)} · {u.expense_count} expenses ·{" "}
                    {formatCurrency(u.expense_sum)}
                  </p>
                </div>
                <RoleBadge u={u} />
              </div>
              <RoleButton u={u} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────

function CategoriesTab() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<AdminCategory[]>("/api/admin/categories")
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-revert delete confirm after 3s
  useEffect(() => {
    if (confirmDeleteId === null) return;
    const t = setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => clearTimeout(t);
  }, [confirmDeleteId]);

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

  const handleDelete = async (cat: AdminCategory) => {
    if (confirmDeleteId !== cat.id) {
      setConfirmDeleteId(cat.id);
      return;
    }
    setDeleting(cat.id);
    try {
      await apiFetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      showToast(`"${cat.name}" deleted.`);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      showToast(apiErr?.data?.message ?? "Failed to delete.", "error");
    } finally {
      setDeleting(null);
      setConfirmDeleteId(null);
    }
  };

  const openEdit = (cat: AdminCategory) => {
    setEditTarget(cat);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  return (
    <>
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-sm font-semibold text-white">Default Categories</p>
            <p className="text-xs text-white/40 mt-0.5">
              Global categories shared with all users
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
          >
            <span className="material-symbols-rounded text-[16px]">add</span>
            Add Category
          </button>
        </div>

        {loading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 animate-pulse flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded w-28" />
                  <div className="h-2.5 bg-white/5 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="px-5 py-8 text-center text-white/30 text-sm">
            No global categories found.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.03] transition-colors"
              >
                {/* Icon tile */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.color + "33", color: cat.color }}
                >
                  <span className="material-symbols-rounded text-[18px]">{cat.icon}</span>
                </div>

                {/* Name + count */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{cat.name}</p>
                  <p className="text-xs text-white/40">
                    {cat.expense_count} expense{cat.expense_count !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
                    title="Edit"
                  >
                    <span className="material-symbols-rounded text-[16px]">edit</span>
                  </button>

                  {cat.expense_count > 0 ? (
                    <button
                      disabled
                      title={`In use by ${cat.expense_count} expense${cat.expense_count !== 1 ? "s" : ""} — cannot delete`}
                      className="p-2 rounded-lg text-white/20 cursor-not-allowed"
                    >
                      <span className="material-symbols-rounded text-[16px]">delete</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={deleting === cat.id}
                      className={`p-2 rounded-lg transition-all ${
                        confirmDeleteId === cat.id
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "text-white/40 hover:text-red-400 hover:bg-red-500/10"
                      }`}
                      title={confirmDeleteId === cat.id ? "Click again to confirm" : "Delete"}
                    >
                      {deleting === cat.id ? (
                        <span className="material-symbols-rounded text-[16px] animate-spin">
                          progress_activity
                        </span>
                      ) : confirmDeleteId === cat.id ? (
                        <span className="text-xs font-medium leading-none">Confirm?</span>
                      ) : (
                        <span className="material-symbols-rounded text-[16px]">delete</span>
                      )}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
  const activeTab = ((searchParams.get("tab") ?? "overview") as Tab) || "overview";

  const setTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/admin?${params.toString()}`);
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
          <span className="material-symbols-rounded text-[14px]">lock</span>
          Admin access only
        </span>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-rounded text-[16px]">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "users" && <UsersTab currentUserId={currentUserId} />}
      {activeTab === "categories" && <CategoriesTab />}
    </div>
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
        <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-6">
          <div className="h-7 bg-white/5 rounded-xl w-36 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white/5 border border-white/10 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
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
