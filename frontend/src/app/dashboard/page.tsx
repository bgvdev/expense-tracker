"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useExpenses } from "@/hooks/useExpenses";
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
import EditExpenseModal from "@/components/EditExpenseModal";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import type { Expense } from "@/lib/types";

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
  const { expenses, meta, loading: expensesLoading, error, addExpense, updateExpense, removeExpense } = useExpenses(1, 10);
  const { expenses: allExpenses, loading: allExpensesLoading, refetch: refetchAllExpenses } = useAllExpenses();
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
          onAdd={async (data) => { await addExpense(data); await fetchSummary(); await refetchAllExpenses(); setAddExpenseOpen(false); showToast("Expense added!"); }}
          categories={categories}
          catLoading={catLoading}
          paymentMethods={paymentMethods}
        />
      </Modal>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onSave={async (id, data) => { await updateExpense(id, data); await fetchSummary(); await refetchAllExpenses(); showToast("Expense updated!"); }}
          onClose={() => setEditingExpense(null)}
          categories={categories}
          catLoading={catLoading}
          paymentMethods={paymentMethods}
        />
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
            value={meta?.total ?? expenses.length}
            icon="receipt_long"
            accent="pink"
            isCurrency={false}
            loading={expensesLoading}
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
                  {expensesLoading ? "Loading…" : `Last ${expenses.length} of ${meta?.total ?? expenses.length}`}
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
            expenses={expenses}
            totalCount={meta?.total ?? expenses.length}
            loading={expensesLoading}
            onEdit={setEditingExpense}
            onDelete={async (id) => { await removeExpense(id); await fetchSummary(); await refetchAllExpenses(); showToast("Expense deleted."); }}
          />
        </div>

      </div>
    </>
  );
}
