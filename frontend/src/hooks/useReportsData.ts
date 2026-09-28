"use client";

import { useMemo } from "react";
import { useExpenseStats, type CategoryRef } from "@/hooks/useExpenseStats";
import { EMPTY_FILTERS, toYmd, type FilterState } from "@/lib/expenseQuery";
import type { Expense } from "@/lib/types";

interface MonthlyDataPoint {
  month: string;
  total: number;
}

interface CategoryBreakdownItem {
  category: CategoryRef;
  total: number;
  percentage: number;
}

interface DailyDataPoint {
  day: string;
  total: number;
}

interface PaymentMethodDataPoint {
  method: string;
  total: number;
}

interface SummaryStats {
  totalSpent: number;
  expenseCount: number;
  highestExpense: Expense | null;
  mostUsedCategory: { category: CategoryRef; count: number } | null;
  avgDailySpend: number;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface ReportsData {
  monthlySpending: MonthlyDataPoint[];
  categoryBreakdown: CategoryBreakdownItem[];
  dailySpending: DailyDataPoint[];
  paymentMethodBreakdown: PaymentMethodDataPoint[];
  summary: SummaryStats;
  loading: boolean;
  error: string | null;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const dayKey = toYmd;

/** A Y-m-d from the API as a local-midnight Date. */
function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Chart- and tile-ready report data. The API does the aggregation (one
 * GET /api/expenses/stats for the range); this hook only lays the results out
 * into the buckets each chart shows, filling gaps with zeros.
 */
export function useReportsData(range: DateRange = { from: null, to: null }): ReportsData {
  const hasRange = range.from !== null || range.to !== null;
  const fromKey = range.from ? toYmd(range.from) : null;
  const toKey = range.to ? toYmd(range.to) : null;

  const filters = useMemo<FilterState>(
    () => (hasRange ? { ...EMPTY_FILTERS, datePreset: "custom", customFrom: fromKey, customTo: toKey } : EMPTY_FILTERS),
    [hasRange, fromKey, toKey],
  );
  const { stats, loading, error } = useExpenseStats(filters);

  const monthlySpending = useMemo<MonthlyDataPoint[]>(() => {
    const totals = new Map((stats?.monthly ?? []).map((m) => [m.month, m.total]));
    const points: MonthlyDataPoint[] = [];
    const push = (d: Date) => {
      points.push({ month: d.toLocaleString("en-IN", { month: "short", year: "numeric" }), total: totals.get(monthKey(d)) ?? 0 });
    };

    if (hasRange) {
      // An open start runs from the first expense in the range.
      const start = range.from ?? (stats?.first_date ? fromYmd(stats.first_date) : range.to ?? new Date());
      const end = range.to ?? new Date();
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cursor <= last) {
        push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      const now = new Date();
      for (let i = 5; i >= 0; i--) push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    return points;
  }, [stats, hasRange, range.from, range.to]);

  const categoryBreakdown = useMemo<CategoryBreakdownItem[]>(() => {
    const grandTotal = stats?.total ?? 0;
    return (stats?.by_category ?? []).map(({ category, total }) => ({
      category,
      total,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }));
  }, [stats]);

  const dailySpending = useMemo<DailyDataPoint[]>(() => {
    const totals = new Map((stats?.daily ?? []).map((d) => [d.date, d.total]));
    const now = new Date();
    const start = hasRange
      ? (range.from ?? new Date(now.getFullYear(), now.getMonth(), 1))
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = hasRange ? (range.to ?? now) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const spansMultipleMonths = start.getFullYear() !== end.getFullYear() || start.getMonth() !== end.getMonth();

    const points: DailyDataPoint[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= lastDay) {
      points.push({
        day: spansMultipleMonths
          ? cursor.toLocaleString("en-IN", { month: "short", day: "numeric" })
          : String(cursor.getDate()),
        total: totals.get(dayKey(cursor)) ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }, [stats, hasRange, range.from, range.to]);

  const paymentMethodBreakdown = useMemo<PaymentMethodDataPoint[]>(
    () => (stats?.by_payment_method ?? []).map((p) => ({ method: p.name ?? "Unspecified", total: p.total })),
    [stats],
  );

  const summary = useMemo<SummaryStats>(() => {
    if (!stats || stats.count === 0) {
      return { totalSpent: stats?.total ?? 0, expenseCount: 0, highestExpense: null, mostUsedCategory: null, avgDailySpend: 0 };
    }

    const now = new Date();
    let periodTotal: number;
    let daysElapsed: number;
    if (hasRange) {
      periodTotal = stats.total;
      const start = range.from ?? (stats.first_date ? fromYmd(stats.first_date) : now);
      const end = range.to && range.to < now ? range.to : now;
      daysElapsed = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    } else {
      // All time: the average is this month's, per day so far.
      const monthPrefix = monthKey(now);
      periodTotal = stats.daily.filter((d) => d.date.startsWith(monthPrefix)).reduce((sum, d) => sum + d.total, 0);
      daysElapsed = now.getDate();
    }
    const avgDailySpend = daysElapsed > 0 ? Math.round((periodTotal / daysElapsed) * 100) / 100 : 0;

    return {
      totalSpent: stats.total,
      expenseCount: stats.count,
      highestExpense: stats.highest,
      mostUsedCategory: stats.most_used_category,
      avgDailySpend,
    };
  }, [stats, hasRange, range.from, range.to]);

  return {
    monthlySpending,
    categoryBreakdown,
    dailySpending,
    paymentMethodBreakdown,
    summary,
    loading,
    error,
  };
}
