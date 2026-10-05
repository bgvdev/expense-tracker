"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { useExpenses, useExpenseMutations } from "@/hooks/useExpenses";
import { useExpenseStats } from "@/hooks/useExpenseStats";
import { useExpenseSummary } from "@/hooks/useExpenseSummary";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useToast } from "@/hooks/useToast";
import Page from "@/components/layout/Page";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Button, { buttonClasses } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import ExpenseList from "@/components/ExpenseList";
import ExpensePanel from "@/components/ExpensePanel";
import CategoryBreakdown, { toBreakdown } from "@/components/CategoryBreakdown";
import { EMPTY_FILTERS } from "@/lib/expenseQuery";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import type { Expense } from "@/lib/types";

/** How many of the newest expenses the "Recent Expenses" card shows. */
const RECENT_LIMIT = 10;

/** How many categories the spending breakdown lists before folding the rest into one row. */
const TOP_CATEGORIES = 5;

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
  // Just the newest page for the list; totals and the category breakdown span
  // every expense, so they come from the stats endpoint rather than this page.
  const { expenses: recentExpenses, loading: recentLoading, error, refetch: refetchRecent } =
    useExpenses({ filters: EMPTY_FILTERS, perPage: RECENT_LIMIT });
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useExpenseStats();
  const { addExpense, updateExpense, removeExpense } = useExpenseMutations();
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

  const totalSpent = stats?.total ?? 0;
  const totalCount = stats?.count ?? 0;
  const categoryBreakdown = useMemo(() => toBreakdown(stats?.by_category ?? [], totalSpent), [stats, totalSpent]);

  /** After any write: the list, the all-time figures and this month's total. */
  const refreshAll = () => Promise.all([refetchRecent(), refetchStats(), fetchSummary()]);

  if (!user) return null;

  return (
    <>
      <ExpensePanel
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSubmit={async (data) => { await addExpense(data); await refreshAll(); setAddExpenseOpen(false); showToast("Expense added!"); }}
        categories={categories}
        catLoading={catLoading}
        paymentMethods={paymentMethods}
      />

      {editingExpense && (
        <ExpensePanel
          open
          onClose={() => setEditingExpense(null)}
          expense={editingExpense}
          onSubmit={async (data) => {
            await updateExpense(editingExpense.id, data);
            await refreshAll();
            setEditingExpense(null);
            showToast("Expense updated!");
          }}
          categories={categories}
          catLoading={catLoading}
          paymentMethods={paymentMethods}
        />
      )}

      <Page>
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${user.name.split(" ")[0]}`}
          actions={
            <Button variant="primary" icon="add" collapseLabel onClick={() => setAddExpenseOpen(true)} aria-label="New expense">
              New expense
            </Button>
          }
        />

        {/* Without this the tiles and the breakdown would report a confident
            zero for figures the API never returned. */}
        {statsError && statsError !== "unauthenticated" && (
          <Alert className="mb-6">{statsError}</Alert>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            label="This month"
            value={formatCurrency(thisMonth)}
            icon="calendar_month"
            loading={summaryLoading}
          />
          <StatCard
            label="Transactions"
            value={totalCount}
            icon="receipt_long"
            hint={statsLoading ? undefined : `${formatCurrency(totalSpent, { decimals: false })} all time`}
            loading={statsLoading}
          />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-5">
          <Card className="overflow-hidden lg:col-span-3">
            <CardHeader
              title="Recent expenses"
              description={recentLoading || statsLoading ? "Loading…" : `Latest ${recentExpenses.length} of ${totalCount}`}
              action={
                <Link href="/expenses" className={buttonClasses({ variant: "ghost", size: "sm" })}>
                  View all
                </Link>
              }
              className="border-b border-border"
            />

            {error && error !== "unauthenticated" && (
              <Alert className="m-4">{error}</Alert>
            )}

            <ExpenseList
              compact
              expenses={recentExpenses}
              totalCount={totalCount}
              loading={recentLoading}
              onEdit={setEditingExpense}
              onDelete={async (id) => { await removeExpense(id); await refreshAll(); showToast("Expense deleted."); }}
            />
          </Card>

          <div className="lg:col-span-2">
            <CategoryBreakdown
              breakdown={categoryBreakdown}
              filteredTotal={totalSpent}
              loading={statsLoading}
              limit={TOP_CATEGORIES}
            />
          </div>
        </div>
      </Page>
    </>
  );
}
