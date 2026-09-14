"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useAllExpenses } from "@/hooks/useAllExpenses";
import { useExpenseSummary } from "@/hooks/useExpenseSummary";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useFilteredExpenses, DEFAULT_FILTERS } from "@/hooks/useFilteredExpenses";
import { useToast } from "@/hooks/useToast";
import Modal from "@/components/ui/Modal";
import SummaryCard from "@/components/ui/SummaryCard";
import ExpenseList from "@/components/ExpenseList";
import ExpenseForm from "@/components/ExpenseForm";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import type { Expense } from "@/lib/types";

/** How many of the newest expenses the "Recent Expenses" card shows. */
const RECENT_LIMIT = 10;

export default function DashboardPage() {
  return (
    <RequireAuth>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  // One expense fetch, not two: this page previously ran useExpenses(1, 10)
  // alongside useAllExpenses(), so the ten most recent rows were fetched twice
  // over. The "Recent Expenses" list is just the head of the full list, which
  // the API already returns newest-first.
  const {
    expenses: allExpenses,
    loading: allExpensesLoading,
    error,
    addExpense,
    updateExpense,
    removeExpense,
  } = useAllExpenses();
  const { thisMonth, loading: summaryLoading, fetchSummary } = useExpenseSummary();
  const { categories, loading: catLoading, fetchCategories } = useCategories();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethods();
  const { showToast } = useToast();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchPaymentMethods();
    }
  }, [user, fetchCategories, fetchPaymentMethods]);

  const recentExpenses = useMemo(() => allExpenses.slice(0, RECENT_LIMIT), [allExpenses]);

  // Category breakdown and total reflect ALL of the user's expenses, not just the
  // 10 most recent ones shown in the "Recent Expenses" list below.
  const { categoryBreakdown } = useFilteredExpenses(allExpenses, DEFAULT_FILTERS);

  const totalSpent = useMemo(
    () => allExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [allExpenses]
  );

  if (!user) return null;

  return (
    <>
      {/* Add Expense Modal */}
      <Modal open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} title="New Expense">
        <ExpenseForm
          onSubmit={async (data) => { await addExpense(data); await fetchSummary(); setAddExpenseOpen(false); showToast("Expense added!"); }}
          categories={categories}
          catLoading={catLoading}
          paymentMethods={paymentMethods}
        />
      </Modal>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <Modal open onClose={() => setEditingExpense(null)} title="Edit Expense">
          <ExpenseForm
            expense={editingExpense}
            onSubmit={async (data) => {
              await updateExpense(editingExpense.id, data);
              await fetchSummary();
              setEditingExpense(null);
              showToast("Expense updated!");
            }}
            onCancel={() => setEditingExpense(null)}
            categories={categories}
            catLoading={catLoading}
            paymentMethods={paymentMethods}
          />
        </Modal>
      )}

      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Welcome back, {user.name.split(" ")[0]}
            </p>
          </div>
          <button
            onClick={() => setAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-semibold transition-all"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
            <span className="hidden sm:inline">New Expense</span>
          </button>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <SummaryCard
            label="This Month"
            value={thisMonth}
            icon="calendar_month"
            accent="purple"
            loading={summaryLoading}
          />
          <SummaryCard
            label="Transactions"
            value={allExpenses.length}
            icon="receipt_long"
            accent="pink"
            isCurrency={false}
            loading={allExpensesLoading}
          />
        </div>

        {/* ── Category breakdown ── */}
        {!allExpensesLoading && (
          <div className="mb-6">
            <CategoryBreakdown
              breakdown={categoryBreakdown}
              filteredTotal={totalSpent}
              loading={allExpensesLoading}
            />
          </div>
        )}

        {/* ── Recent expenses ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="material-symbols-rounded text-purple-400 text-xl">list_alt</span>
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Recent Expenses</h2>
                <p className="text-xs text-white/35">
                  {allExpensesLoading ? "Loading…" : `Last ${recentExpenses.length} of ${allExpenses.length}`}
                </p>
              </div>
            </div>
            <Link
              href="/expenses"
              className="text-xs text-indigo-300 hover:text-indigo-200 font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>arrow_forward</span>
            </Link>
          </div>

          {error && error !== "unauthenticated" && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
              <span className="material-symbols-rounded text-base">error</span>
              {error}
            </div>
          )}

          <ExpenseList
            expenses={recentExpenses}
            totalCount={allExpenses.length}
            loading={allExpensesLoading}
            onEdit={setEditingExpense}
            onDelete={async (id) => { await removeExpense(id); await fetchSummary(); showToast("Expense deleted."); }}
          />
        </div>

      </div>
    </>
  );
}
