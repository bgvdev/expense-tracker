"use client";

import { useMemo, useEffect } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import ExpenseList from "@/components/ExpenseList";
import ExpenseForm from "@/components/ExpenseForm";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { expenses, loading: expensesLoading, error, addExpense } = useExpenses();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );

  const thisMonth = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.spent_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-white/50">
          <span className="h-5 w-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          Loading your dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* ── Top Nav ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{user.name}</p>
            <p className="text-xs text-white/50">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/80 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-rounded text-lg">logout</span>
          Sign out
        </button>
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Expense Dashboard
        </h1>
        <p className="text-white/40 text-sm mt-1">Track and manage your spending</p>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          label="Total Spent"
          value={totalSpent}
          icon="account_balance_wallet"
          accent="indigo"
          loading={expensesLoading}
        />
        <SummaryCard
          label="This Month"
          value={thisMonth}
          icon="calendar_month"
          accent="purple"
          loading={expensesLoading}
        />
        <SummaryCard
          label="Transactions"
          value={expenses.length}
          icon="receipt_long"
          accent="pink"
          isCurrency={false}
          loading={expensesLoading}
        />
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Form panel */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-rounded text-indigo-400 text-xl">add_circle</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-white">New Expense</h2>
              <p className="text-xs text-white/35">Fill in the details below</p>
            </div>
          </div>
          <ExpenseForm onAdd={addExpense} />
        </div>

        {/* List panel */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="material-symbols-rounded text-purple-400 text-xl">list_alt</span>
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Recent Expenses</h2>
                <p className="text-xs text-white/35">
                  {expensesLoading ? "Loading…" : `${expenses.length} record${expenses.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            {!expensesLoading && expenses.length > 0 && (
              <span className="text-xs text-white/30 font-mono">↓ newest first</span>
            )}
          </div>

          {error && error !== "unauthenticated" && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
              <span className="material-symbols-rounded text-base">error</span>
              {error}
            </div>
          )}

          <ExpenseList expenses={expenses} loading={expensesLoading} />
        </div>
      </div>
    </main>
  );
}

// ── Summary Card ─────────────────────────────────────────────────────────────
interface SummaryCardProps {
  label: string;
  value: number;
  icon: string;
  accent: "indigo" | "purple" | "pink";
  isCurrency?: boolean;
  loading: boolean;
}

const accentClasses: Record<string, { bg: string; text: string }> = {
  indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400" },
  pink:   { bg: "bg-pink-500/20",   text: "text-pink-400"   },
};

function SummaryCard({
  label,
  value,
  icon,
  accent,
  isCurrency = true,
  loading,
}: SummaryCardProps) {
  const { bg, text } = accentClasses[accent];

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <span className={`material-symbols-rounded text-2xl ${text}`}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-6 w-24 bg-white/10 rounded animate-pulse" />
        ) : (
          <p className={`text-2xl font-extrabold ${text}`}>
            {isCurrency
              ? `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : value}
          </p>
        )}
      </div>
    </div>
  );
}
