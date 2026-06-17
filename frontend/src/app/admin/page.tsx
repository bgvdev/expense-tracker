"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import apiFetch from "@/lib/api";

interface AdminStats {
  total_users: number;
  total_expenses_count: number;
  total_expenses_sum: string;
  total_categories: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

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

function AdminPageInner() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Guard: redirect non-admins silently
  useEffect(() => {
    if (user && !user.is_admin) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.is_admin) return;

    Promise.all([
      apiFetch<AdminStats>("/api/admin/stats"),
      apiFetch<AdminUser[]>("/api/admin/users"),
    ]).then(([s, u]) => {
      setStats(s);
      setUsers(u);
    }).finally(() => setLoading(false));
  }, [user]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  if (!user?.is_admin) return null;

  function formatCurrency(raw: string) {
    return "₹" + Number(raw).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="hidden md:flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        <span className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
          <span className="material-symbols-rounded text-[14px]">lock</span>
          Admin access only
        </span>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white/5 border border-white/10 px-5 py-5 animate-pulse h-28" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon="group"
            label="Users"
            value={stats.total_users.toLocaleString()}
            sub="registered"
          />
          <StatCard
            icon="receipt_long"
            label="Expenses"
            value={stats.total_expenses_count.toLocaleString()}
            sub="transactions"
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
            sub="across users"
          />
        </div>
      ) : null}

      {/* Users section */}
      <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">

        {/* Section header + search */}
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-10">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Role</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-white/30 text-sm">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3 text-white/30">{idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                    <td className="px-5 py-3 text-white/60">{u.email}</td>
                    <td className="px-5 py-3 text-white/40">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3">
                      {u.is_admin && (
                        <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs px-2 py-0.5">
                          <span className="material-symbols-rounded text-[12px]">shield</span>
                          Admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-white/5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5 animate-pulse">
                <div className="h-3 bg-white/10 rounded w-32" />
                <div className="h-3 bg-white/5 rounded w-48" />
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <p className="px-4 py-8 text-center text-white/30 text-sm">
              {search ? "No users match your search." : "No users found."}
            </p>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-white/50 truncate">{u.email}</p>
                  <p className="text-xs text-white/30 mt-0.5">Joined {formatDate(u.created_at)}</p>
                </div>
                {u.is_admin && (
                  <span className="shrink-0 inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs px-2 py-0.5">
                    <span className="material-symbols-rounded text-[12px]">shield</span>
                    Admin
                  </span>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
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
