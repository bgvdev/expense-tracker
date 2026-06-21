"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAllExpenses } from "@/hooks/useAllExpenses";
import { useExpenseSummary } from "@/hooks/useExpenseSummary";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useFilteredExpenses, FilterState, DEFAULT_FILTERS } from "@/hooks/useFilteredExpenses";
import { useToast } from "@/hooks/useToast";
import Modal from "@/components/ui/Modal";
import SummaryCard from "@/components/ui/SummaryCard";
import Pagination from "@/components/ui/Pagination";
import ExpenseList from "@/components/ExpenseList";
import ExpenseForm from "@/components/ExpenseForm";
import EditExpenseModal from "@/components/EditExpenseModal";
import ExpenseFilters from "@/components/ExpenseFilters";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import { exportToCSV } from "@/lib/utils";
import type { Expense, PaginationMeta } from "@/lib/types";

const PER_PAGE_OPTIONS = [5, 10, 15, 25, 50];
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
  // Filters, totals, and the category breakdown must reflect the user's overall
  // expenses, not just whichever page happens to be fetched — so we load the
  // full dataset once and filter/paginate it client-side.
  const { expenses, loading: expensesLoading, error, addExpense, updateExpense, removeExpense } =
    useAllExpenses();
  const { thisMonth, loading: summaryLoading, fetchSummary } = useExpenseSummary();
  const { categories, loading: catLoading, fetchCategories } = useCategories();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethods();
  const { showToast } = useToast();

  const [filters, setFilters]               = useState<FilterState>(DEFAULT_FILTERS);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchPaymentMethods();
    }
  }, [user, fetchCategories, fetchPaymentMethods]);

  const { filtered, filteredTotal, filteredCount, isFiltered } =
    useFilteredExpenses(expenses, filters);

  // Client-side pagination over the filtered (overall) result set.
  const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, lastPage);
  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filtered, currentPage, perPage]
  );
  const meta: PaginationMeta = {
    current_page: currentPage,
    last_page: lastPage,
    per_page: perPage,
    total: filtered.length,
  };

  const buildUrl = (p: number, pp: number) =>
    `/expenses?page=${p}&per_page=${pp}`;

  const handlePageChange = (newPage: number) => {
    router.push(buildUrl(newPage, perPage));
  };

  const handlePerPageChange = (newPerPage: number) => {
    router.push(buildUrl(1, newPerPage));
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    if (page !== 1) router.push(buildUrl(1, perPage));
  };

  const totalCount  = expenses.length;
  const showingFrom = filteredCount === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const showingTo   = Math.min(meta.current_page * meta.per_page, filteredCount);

  if (!user) return null;

  return (
    <>
      {/* Add Expense Modal */}
      <Modal open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} title="New Expense">
        <ExpenseForm
          onAdd={async (data) => { await addExpense(data); await fetchSummary(); setAddExpenseOpen(false); showToast("Expense added!"); }}
          categories={categories}
          catLoading={catLoading}
          paymentMethods={paymentMethods}
        />
      </Modal>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onSave={async (id, data) => { await updateExpense(id, data); await fetchSummary(); showToast("Expense updated!"); }}
          onClose={() => setEditingExpense(null)}
          categories={categories}
          catLoading={catLoading}
          paymentMethods={paymentMethods}
        />
      )}

      <div className="p-4 md:p-8 max-w-5xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Expenses
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {expensesLoading ? "Loading…" : `${totalCount} expense${totalCount !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!expensesLoading && filtered.length > 0 && (
              <button
                onClick={() => exportToCSV(filtered)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/60 hover:text-white/80 transition-all"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>download</span>
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
            <button
              onClick={() => setAddExpenseOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm font-semibold transition-all"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
              <span className="hidden sm:inline">New Expense</span>
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className={`grid gap-4 mb-6 ${isFiltered ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
          <SummaryCard
            label="This Month"
            value={thisMonth}
            icon="calendar_month"
            accent="indigo"
            loading={summaryLoading}
          />
          <SummaryCard
            label="Transactions"
            value={totalCount}
            icon="receipt_long"
            accent="purple"
            isCurrency={false}
            loading={expensesLoading}
          />
          {isFiltered && (
            <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/25 backdrop-blur-sm p-5 flex items-center gap-4 ring-1 ring-indigo-500/20">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/25 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-2xl text-indigo-300">filter_alt</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-indigo-300/70 font-semibold uppercase tracking-widest">Filtered</p>
                <p className="text-2xl font-extrabold text-indigo-300 truncate">
                  ₹{filteredTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-indigo-300/50 mt-0.5">
                  {filteredCount} of {totalCount} overall
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        {!expensesLoading && (
          <div className="mb-6">
            <ExpenseFilters
              categories={categories}
              paymentMethods={paymentMethods}
              filters={filters}
              onChange={handleFiltersChange}
              filteredCount={filteredCount}
              totalCount={totalCount}
              filteredTotal={filteredTotal}
              isFiltered={isFiltered}
            />
          </div>
        )}

        {/* ── Expense list ── */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="material-symbols-rounded text-purple-400 text-xl">receipt_long</span>
              </span>
              <div>
                <h2 className="text-base font-bold text-white">All Expenses</h2>
                {!expensesLoading && (
                  <p className="text-xs text-white/35">
                    {isFiltered
                      ? `${filteredCount} of ${totalCount} match — showing ${showingFrom}–${showingTo}`
                      : `Showing ${showingFrom}–${showingTo} of ${totalCount}`}
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/categories"
              className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>label</span>
              <span className="hidden sm:inline">Manage Categories</span>
            </Link>
          </div>

          {error && error !== "unauthenticated" && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
              <span className="material-symbols-rounded text-base">error</span>
              {error}
            </div>
          )}

          <ExpenseList
            expenses={pageItems}
            totalCount={totalCount}
            loading={expensesLoading}
            onEdit={setEditingExpense}
            onDelete={async (id) => { await removeExpense(id); await fetchSummary(); showToast("Expense deleted."); }}
            onClearFilters={() => handleFiltersChange(DEFAULT_FILTERS)}
          />

          {/* ── Pagination bar + per-page selector ── */}
          {!expensesLoading && filtered.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Pagination meta={meta} onPageChange={handlePageChange} />
              <div className="flex items-center gap-2 text-xs text-white/40 shrink-0">
                <span>Rows per page</span>
                <div className="relative">
                  <select
                    value={perPage}
                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                    className="appearance-none bg-white/8 border border-white/15 text-white/80 rounded-lg pl-3 pr-7 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  >
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n} style={{ background: "#1e1e2e", color: "#e5e7eb" }}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/50 text-[10px]">▾</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
