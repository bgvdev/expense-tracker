"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AppShell from "@/components/layout/AppShell";
import RequireAuth from "@/components/layout/RequireAuth";
import ReportDateFilter from "@/components/ReportDateFilter";
import { useReportsData, type DateRange } from "@/hooks/useReportsData";
import Page from "@/components/layout/Page";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Skeleton from "@/components/ui/Skeleton";
import Alert from "@/components/ui/Alert";
import { formatCurrency, plural } from "@/lib/format";

function LoadingCard({ className = "" }: { className?: string }) {
  return (
    <Skeleton className={`rounded-xl border border-border ${className}`} />
  );
}

// The four charts pull in recharts, which is ~125 kB of this route's JS and is
// used nowhere else in the app. Loading them dynamically lets the page shell,
// the date filter and the summary tiles paint while that chunk downloads —
// static imports blocked the whole route on it. ssr: false because recharts
// measures the DOM to size itself, so it renders nothing useful server-side.
const chartFallback = () => <LoadingCard className="h-72" />;

const MonthlyBarChart = dynamic(() => import("@/components/charts/MonthlyBarChart"), {
  ssr: false,
  loading: chartFallback,
});
const CategoryDonutChart = dynamic(() => import("@/components/charts/CategoryDonutChart"), {
  ssr: false,
  loading: chartFallback,
});
const DailyLineChart = dynamic(() => import("@/components/charts/DailyLineChart"), {
  ssr: false,
  loading: chartFallback,
});
const PaymentMethodChart = dynamic(() => import("@/components/charts/PaymentMethodChart"), {
  ssr: false,
  loading: chartFallback,
});

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
        <Page>
          <PageHeader title="Reports" description="Spending insights and charts" />

          <ReportDateFilter onChange={setRange} />

          {error && (
            <Alert className="mb-6">
              {error === "unauthenticated" ? "Please log in to view reports." : error}
            </Alert>
          )}

          {loading ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <LoadingCard className="h-24" />
                <LoadingCard className="h-24" />
                <LoadingCard className="h-24" />
                <LoadingCard className="h-24" />
              </div>
              <LoadingCard className="h-72" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <LoadingCard className="h-72" />
                <LoadingCard className="h-72" />
              </div>
              <LoadingCard className="h-72" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard
                  label="Total spent"
                  icon="payments"
                  value={formatCurrency(summary.totalSpent, { decimals: false })}
                  hint={`${plural(summary.expenseCount, "expense")} · ${range.from || range.to ? rangeLabel : "All time"}`}
                />
                <StatCard
                  label="Highest expense"
                  icon="arrow_upward"
                  value={summary.highestExpense ? formatCurrency(summary.highestExpense.amount, { decimals: false }) : "—"}
                  hint={summary.highestExpense?.category.name}
                />
                <StatCard
                  label="Most used category"
                  icon={summary.mostUsedCategory?.category.icon ?? "category"}
                  value={summary.mostUsedCategory?.category.name ?? "—"}
                  hint={summary.mostUsedCategory ? plural(summary.mostUsedCategory.count, "expense") : undefined}
                />
                <StatCard
                  label="Avg daily spend"
                  icon="trending_up"
                  value={formatCurrency(summary.avgDailySpend, { decimals: false })}
                  hint={range.from || range.to ? rangeLabel : "This month"}
                />
              </div>

              <MonthlyBarChart data={monthlySpending} periodLabel={range.from || range.to ? rangeLabel : "Last 6 months"} />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CategoryDonutChart data={categoryBreakdown} />
                <PaymentMethodChart data={paymentMethodBreakdown} />
              </div>

              <DailyLineChart data={dailySpending} monthLabel={monthLabel} />
            </div>
          )}
        </Page>
      </AppShell>
    </RequireAuth>
  );
}
