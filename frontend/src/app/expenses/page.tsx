"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExpenses, useExpenseMutations, fetchAllMatching } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import {
  DEFAULT_FILTERS, DEFAULT_SORT, DEFAULT_SORT_DIR, EMPTY_FILTERS, dateBounds, isFiltered as hasFilters,
  type FilterState, type SortKey, type SortState,
} from "@/lib/expenseQuery";
import { useToast } from "@/hooks/useToast";
import Page from "@/components/layout/Page";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import ExpenseList from "@/components/ExpenseList";
import ExpensePanel from "@/components/ExpensePanel";
import ExpenseFilters from "@/components/ExpenseFilters";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import { exportToCSV } from "@/lib/utils";
import type { Expense } from "@/lib/types";

/** Short description of the applied date range, for the total's hint. */
function rangeLabel(f: FilterState): string {
  const labels: Record<string, string> = {
    all: "All time", today: "Today", week: "Last 7 days", month: "This month", last_month: "Last month",
  };
  if (f.datePreset !== "custom") return labels[f.datePreset];
  const [from, to] = dateBounds(f);
  if (from && to) return `${from} – ${to}`;
  if (from) return `Since ${from}`;
  if (to) return `Until ${to}`;
  return "All time";
}

const PER_PAGE_OPTIONS = [5, 10, 15, 25, 50];
const PER_PAGE_SELECT = PER_PAGE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }));
const DEFAULT_PER_PAGE = 10;

export default function ExpensesPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Suspense>
          <ExpensesContent />
        </Suspense>
      </AppShell>
    </RequireAuth>
  );
}

function ExpensesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = (() => {
    const v = parseInt(searchParams.get("per_page") ?? String(DEFAULT_PER_PAGE), 10);
    return PER_PAGE_OPTIONS.includes(v) ? v : DEFAULT_PER_PAGE;
  })();

  const { user } = useAuth();
  const { categories, loading: catLoading, fetchCategories } = useCategories();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethods();
  const { showToast } = useToast();

  // Opens on the current month. Filtering, sorting and paging all happen in the
  // API; this page only says what to ask for and renders the page it gets back.
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort]       = useState<SortState>(DEFAULT_SORT);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [exporting, setExporting] = useState(false);

  const { expenses, meta, loading, error, refetch } = useExpenses({ filters, sort, page, perPage });
  const { addExpense, updateExpense, removeExpense } = useExpenseMutations();

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchPaymentMethods();
    }
  }, [user, fetchCategories, fetchPaymentMethods]);

  const buildUrl = (p: number, pp: number) => `/expenses?page=${p}&per_page=${pp}`;
  const toFirstPage = () => { if (page !== 1) router.push(buildUrl(1, perPage)); };

  // Deleting the last row on the last page would otherwise strand the user on
  // an empty page past the end.
  useEffect(() => {
    if (meta && meta.last_page >= 1 && page > meta.last_page) router.replace(buildUrl(meta.last_page, perPage));
  }, [meta, page, perPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange    = (newPage: number) => router.push(buildUrl(newPage, perPage));
  const handlePerPageChange = (newPerPage: number) => router.push(buildUrl(1, newPerPage));

  const handleApplyFilters = (next: FilterState) => {
    setFilters(next);
    toFirstPage();
  };

  /** Re-click the active column to flip it; a new column starts at its natural direction. */
  const handleSort = (key: SortKey) => {
    setSort((s) => ({
      sortKey: key,
      sortDir: s.sortKey === key ? (s.sortDir === "asc" ? "desc" : "asc") : DEFAULT_SORT_DIR[key],
    }));
    toFirstPage();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      exportToCSV(await fetchAllMatching(filters, sort));
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  const isFiltered  = hasFilters(filters);
  const matching    = meta?.total ?? 0;
  const userTotal   = meta?.user_total ?? 0;
  const showingFrom = matching === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo   = Math.min(page * perPage, matching);

  if (!user) return null;

  return (
    <>
      <ExpensePanel
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onSubmit={async (data) => { await addExpense(data); await refetch(); setAddExpenseOpen(false); showToast("Expense added!"); }}
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
            await refetch();
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
          title="Expenses"
          description={
            !meta ? "Loading…"
              : isFiltered ? `${matching} of ${userTotal} expense${userTotal !== 1 ? "s" : ""} match`
              : `${userTotal} expense${userTotal !== 1 ? "s" : ""} total`
          }
          actions={
            <>
              {matching > 0 && (
                <Button icon="download" collapseLabel loading={exporting} onClick={handleExport} aria-label="Export CSV">
                  Export CSV
                </Button>
              )}
              <Button variant="primary" icon="add" collapseLabel onClick={() => setAddExpenseOpen(true)} aria-label="New expense">
                New expense
              </Button>
            </>
          }
        />

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            label="Total spent"
            value={formatCurrency(meta?.total_amount ?? 0)}
            icon="payments"
            hint={isFiltered ? rangeLabel(filters) : "All time"}
            loading={!meta}
          />
          <StatCard
            label="Transactions"
            value={matching}
            icon="receipt_long"
            hint={isFiltered && meta ? `of ${userTotal} overall` : undefined}
            loading={!meta}
          />
        </div>

        <div className="mb-4">
          <ExpenseFilters
            categories={categories}
            paymentMethods={paymentMethods}
            filters={filters}
            onApply={handleApplyFilters}
          />
        </div>

        <Card>
          <CardHeader
            title="All expenses"
            description={loading && !meta ? undefined : matching === 0 ? "No matching expenses" : `Showing ${showingFrom}–${showingTo} of ${matching}`}
            className="border-b border-border"
          />

          {error && error !== "unauthenticated" && <Alert className="m-4">{error}</Alert>}

          <ExpenseList
            expenses={expenses}
            totalCount={userTotal}
            loading={loading}
            onEdit={setEditingExpense}
            onDelete={async (id) => { await removeExpense(id); await refetch(); showToast("Expense deleted."); }}
            onClearFilters={() => handleApplyFilters(EMPTY_FILTERS)}
            sortKey={sort.sortKey}
            sortDir={sort.sortDir}
            onSort={handleSort}
          />

          {meta && matching > 0 && (
            <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Rows per page</span>
                <div className="w-20">
                  <Select
                    size="sm"
                    aria-label="Rows per page"
                    value={String(perPage)}
                    onChange={(v) => handlePerPageChange(Number(v))}
                    options={PER_PAGE_SELECT}
                    searchable={false}
                  />
                </div>
              </div>
              <Pagination meta={meta} onPageChange={handlePageChange} />
            </div>
          )}
        </Card>
      </Page>
    </>
  );
}
