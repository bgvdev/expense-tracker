"use client";

import { useMemo, useEffect, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useFilteredExpenses, FilterState, DEFAULT_FILTERS } from "@/hooks/useFilteredExpenses";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import ExpenseList from "@/components/ExpenseList";
import ExpenseForm from "@/components/ExpenseForm";
import EditExpenseModal from "@/components/EditExpenseModal";
import ExpenseFilters from "@/components/ExpenseFilters";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import CategoryModal from "@/components/CategoryModal";
import { exportToCSV } from "@/lib/utils";
import type { Category, Expense, NewCategory } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { expenses, loading: expensesLoading, error, addExpense, updateExpense, removeExpense } = useExpenses();
  const { categories, loading: catLoading, fetchCategories, addCategory, updateCategory, removeCategory } = useCategories();
  const { showToast } = useToast();
  const router = useRouter();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filters, setFilters]               = useState<FilterState>(DEFAULT_FILTERS);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [catModalOpen, setCatModalOpen]     = useState(false);
  const [editingCat, setEditingCat]         = useState<Category | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchCategories();
  }, [user, fetchCategories]);

  const { filtered, filteredTotal, filteredCount, categoryBreakdown, isFiltered } =
    useFilteredExpenses(expenses, filters);

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

  async function handleSaveCategory(data: NewCategory) {
    if (editingCat) {
      await updateCategory(editingCat.id, data);
      showToast("Category updated!");
    } else {
      await addCategory(data);
      showToast("Category created!");
    }
  }

  async function handleRemoveCategory(id: number) {
    try {
      await removeCategory(id);
      showToast("Category deleted.");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      showToast(apiErr.data?.message ?? "Failed to delete category.", "error");
    }
  }

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
    <>
      {/* Add Expense Modal */}
      <Modal open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} title="New Expense">
        <ExpenseForm
          onAdd={async (data) => { await addExpense(data); setAddExpenseOpen(false); }}
          categories={categories}
          catLoading={catLoading}
        />
      </Modal>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onSave={updateExpense}
          onClose={() => setEditingExpense(null)}
          categories={categories}
          catLoading={catLoading}
        />
      )}

      {/* Category Modal */}
      <CategoryModal
        open={catModalOpen}
        onClose={() => { setCatModalOpen(false); setEditingCat(undefined); }}
        category={editingCat}
        onSave={handleSaveCategory}
      />

      <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
        {/* ── Top Nav ── */}
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
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/80 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-rounded text-lg">settings</span>
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/80 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-rounded text-lg">logout</span>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Expense Dashboard
          </h1>
          <p className="text-white/40 text-sm mt-1">Track and manage your spending</p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            label={isFiltered ? "Filtered Total" : "Total Spent"}
            value={isFiltered ? filteredTotal : totalSpent}
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
            label={isFiltered ? "Matching" : "Transactions"}
            value={isFiltered ? filteredCount : expenses.length}
            icon="receipt_long"
            accent="pink"
            isCurrency={false}
            loading={expensesLoading}
          />
        </div>

        {/* ── Filters (always visible) ── */}
        {!expensesLoading && (
          <div className="mb-6">
            <ExpenseFilters
              categories={categories}
              filters={filters}
              onChange={setFilters}
              filteredCount={filteredCount}
              totalCount={expenses.length}
              filteredTotal={filteredTotal}
              isFiltered={isFiltered}
            />
          </div>
        )}

        {/* ── Category Breakdown + Management (always visible) ── */}
        {!expensesLoading && (
          <div className="mb-6">
            <CategoryBreakdown
              breakdown={categoryBreakdown}
              filteredTotal={isFiltered ? filteredTotal : totalSpent}
              loading={expensesLoading}
              categories={catLoading ? undefined : categories}
              onAddCategory={() => { setEditingCat(undefined); setCatModalOpen(true); }}
              onEditCategory={(cat) => { setEditingCat(cat); setCatModalOpen(true); }}
              onRemoveCategory={handleRemoveCategory}
            />
          </div>
        )}

        {/* ── Expense List (full width) ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="material-symbols-rounded text-purple-400 text-xl">list_alt</span>
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Expenses</h2>
                <p className="text-xs text-white/35">
                  {expensesLoading
                    ? "Loading…"
                    : isFiltered
                      ? `${filteredCount} of ${expenses.length} records`
                      : `${expenses.length} record${expenses.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!expensesLoading && filtered.length > 0 && (
                <button
                  onClick={() => exportToCSV(filtered)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/60 hover:text-white/80 transition-all"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>download</span>
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              )}
              <button
                onClick={() => setAddExpenseOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-semibold transition-all"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
                <span className="hidden sm:inline">New Expense</span>
              </button>
            </div>
          </div>

          {error && error !== "unauthenticated" && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
              <span className="material-symbols-rounded text-base">error</span>
              {error}
            </div>
          )}

          <ExpenseList
            expenses={filtered}
            totalCount={expenses.length}
            loading={expensesLoading}
            onEdit={setEditingExpense}
            onDelete={removeExpense}
            onClearFilters={() => setFilters(DEFAULT_FILTERS)}
          />
        </div>
      </main>
    </>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────
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

function SummaryCard({ label, value, icon, accent, isCurrency = true, loading }: SummaryCardProps) {
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
