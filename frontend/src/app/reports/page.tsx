"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import MonthlyBarChart from "@/components/charts/MonthlyBarChart";
import CategoryDonutChart from "@/components/charts/CategoryDonutChart";
import DailyLineChart from "@/components/charts/DailyLineChart";
import PaymentMethodChart from "@/components/charts/PaymentMethodChart";
import ReportDateFilter from "@/components/ReportDateFilter";
import { useReportsData, type DateRange } from "@/hooks/useReportsData";

function LoadingCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/5 border border-white/10 animate-pulse ${className}`} />
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const { monthlySpending, categoryBreakdown, dailySpending, paymentMethodBreakdown, summary, loading, error } =
    useReportsData(range);

  const now = new Date();
  const rangeLabel = (() => {
    if (!range.from && !range.to) return "All time";
    const fmt = (d: Date) => d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (range.from && range.to) return `${fmt(range.from)} – ${fmt(range.to)}`;
    if (range.from) return `Since ${fmt(range.from)}`;
    return `Until ${fmt(range.to!)}`;
  })();
  const monthLabel = range.from || range.to ? rangeLabel : now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <RequireAuth>
      <AppShell>
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Reports
            </h1>
            <p className="text-white/40 text-sm mt-1">Spending insights and charts</p>
          </div>

          <ReportDateFilter onChange={setRange} />

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-6">
              {error === "unauthenticated" ? "Please log in to view reports." : error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <LoadingCard className="h-24" />
                <LoadingCard className="h-24" />
                <LoadingCard className="h-24" />
                <LoadingCard className="h-24" />
              </div>
              <LoadingCard className="h-72" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <LoadingCard className="h-72" />
                <LoadingCard className="h-72" />
              </div>
              <LoadingCard className="h-72" />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Summary stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 flex items-center gap-3">
                  <span className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-emerald-400 text-xl">payments</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-white/40 text-xs">Total Spent</p>
                    <p className="text-white font-bold text-base truncate">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(summary.totalSpent)}
                    </p>
                    <p className="text-white/30 text-xs">
                      {summary.expenseCount} expense{summary.expenseCount !== 1 ? "s" : ""} · {range.from || range.to ? rangeLabel : "All time"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 flex items-center gap-3">
                  <span className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-red-400 text-xl">arrow_upward</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-white/40 text-xs">Highest Expense</p>
                    <p className="text-white font-bold text-base truncate">
                      {summary.highestExpense
                        ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(parseFloat(summary.highestExpense.amount))
                        : "—"}
                    </p>
                    {summary.highestExpense && (
                      <p className="text-white/30 text-xs truncate">{summary.highestExpense.category.name}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 flex items-center gap-3">
                  <span className="h-10 w-10 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-pink-400 text-xl">
                      {summary.mostUsedCategory?.category.icon ?? "category"}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-white/40 text-xs">Most Used Category</p>
                    <p className="text-white font-bold text-base truncate">
                      {summary.mostUsedCategory?.category.name ?? "—"}
                    </p>
                    {summary.mostUsedCategory && (
                      <p className="text-white/30 text-xs">{summary.mostUsedCategory.count} expenses</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 flex items-center gap-3">
                  <span className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-indigo-400 text-xl">trending_up</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-white/40 text-xs">Avg Daily Spend</p>
                    <p className="text-white font-bold text-base truncate">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(summary.avgDailySpend)}
                    </p>
                    <p className="text-white/30 text-xs truncate">{range.from || range.to ? rangeLabel : "This month"}</p>
                  </div>
                </div>
              </div>

              {/* Monthly bar chart — full width */}
              <MonthlyBarChart data={monthlySpending} periodLabel={range.from || range.to ? rangeLabel : "Last 6 months"} />

              {/* Donut + payment method side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CategoryDonutChart data={categoryBreakdown} />
                <PaymentMethodChart data={paymentMethodBreakdown} />
              </div>

              {/* Daily area chart — full width */}
              <DailyLineChart data={dailySpending} monthLabel={monthLabel} />
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
