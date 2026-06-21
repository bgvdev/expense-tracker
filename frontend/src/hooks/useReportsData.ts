"use client";

import { useMemo } from "react";
import { useAllExpenses } from "@/hooks/useAllExpenses";
import type { Category, Expense } from "@/lib/types";

interface MonthlyDataPoint {
  month: string;
  total: number;
}

interface CategoryBreakdownItem {
  category: Category;
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
  mostUsedCategory: { category: Category; count: number } | null;
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

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useReportsData(range: DateRange = { from: null, to: null }): ReportsData {
  const { expenses: allExpenses, loading, error } = useAllExpenses();

  const hasRange = range.from !== null || range.to !== null;

  const expenses = useMemo(() => {
    if (!hasRange) return allExpenses;
    return allExpenses.filter((e) => {
      const d = new Date(e.spent_at);
      if (range.from && d < range.from) return false;
      if (range.to && d > range.to) return false;
      return true;
    });
  }, [allExpenses, hasRange, range.from, range.to]);

  const monthlySpending = useMemo<MonthlyDataPoint[]>(() => {
    const keyToLabel = new Map<string, string>();
    const totals = new Map<string, number>();

    if (hasRange) {
      const start = range.from ?? new Date(Math.min(...allExpenses.map((e) => new Date(e.spent_at).getTime())));
      const end = range.to ?? new Date();
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cursor <= last) {
        const key = monthKey(cursor);
        keyToLabel.set(key, cursor.toLocaleString("en-IN", { month: "short", year: "numeric" }));
        totals.set(key, 0);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = monthKey(d);
        keyToLabel.set(key, d.toLocaleString("en-IN", { month: "short", year: "numeric" }));
        totals.set(key, 0);
      }
    }

    for (const expense of expenses) {
      const key = monthKey(new Date(expense.spent_at));
      if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + parseFloat(expense.amount));
    }

    return Array.from(keyToLabel.entries()).map(([key, month]) => ({
      month,
      total: Math.round((totals.get(key) ?? 0) * 100) / 100,
    }));
  }, [expenses, hasRange, range.from, range.to, allExpenses]);

  const categoryBreakdown = useMemo<CategoryBreakdownItem[]>(() => {
    const map = new Map<number, { category: Category; total: number }>();

    for (const expense of expenses) {
      const { category } = expense;
      const existing = map.get(category.id);
      if (existing) {
        existing.total += parseFloat(expense.amount);
      } else {
        map.set(category.id, { category, total: parseFloat(expense.amount) });
      }
    }

    const grandTotal = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .map(({ category, total }) => ({
        category,
        total: Math.round(total * 100) / 100,
        percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      }));
  }, [expenses]);

  const dailySpending = useMemo<DailyDataPoint[]>(() => {
    const now = new Date();
    const start = hasRange
      ? (range.from ?? new Date(now.getFullYear(), now.getMonth(), 1))
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = hasRange ? (range.to ?? now) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const spansMultipleMonths = start.getFullYear() !== end.getFullYear() || start.getMonth() !== end.getMonth();

    const keyToLabel = new Map<string, string>();
    const totals = new Map<string, number>();
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= lastDay) {
      const key = dayKey(cursor);
      keyToLabel.set(
        key,
        spansMultipleMonths
          ? cursor.toLocaleString("en-IN", { month: "short", day: "numeric" })
          : String(cursor.getDate())
      );
      totals.set(key, 0);
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const expense of expenses) {
      const key = dayKey(new Date(expense.spent_at));
      if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + parseFloat(expense.amount));
    }

    return Array.from(keyToLabel.entries()).map(([key, day]) => ({
      day,
      total: Math.round((totals.get(key) ?? 0) * 100) / 100,
    }));
  }, [expenses, hasRange, range.from, range.to]);

  const paymentMethodBreakdown = useMemo<PaymentMethodDataPoint[]>(() => {
    const map = new Map<string, number>();

    for (const expense of expenses) {
      const method = expense.payment_method?.name ?? "Unspecified";
      map.set(method, (map.get(method) ?? 0) + parseFloat(expense.amount));
    }

    return Array.from(map.entries())
      .sort((a, b) => {
        if (a[0] === "Unspecified") return 1;
        if (b[0] === "Unspecified") return -1;
        return b[1] - a[1];
      })
      .map(([method, total]) => ({ method, total: Math.round(total * 100) / 100 }));
  }, [expenses]);

  const summary = useMemo<SummaryStats>(() => {
    const totalSpent = Math.round(expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) * 100) / 100;

    if (expenses.length === 0) {
      return { totalSpent, expenseCount: 0, highestExpense: null, mostUsedCategory: null, avgDailySpend: 0 };
    }

    const highestExpense = expenses.reduce((max, e) =>
      parseFloat(e.amount) > parseFloat(max.amount) ? e : max
    );

    const catCount = new Map<number, { category: Category; count: number }>();
    for (const expense of expenses) {
      const { category } = expense;
      const existing = catCount.get(category.id);
      if (existing) {
        existing.count++;
      } else {
        catCount.set(category.id, { category, count: 1 });
      }
    }
    const mostUsedCategory = Array.from(catCount.values()).sort((a, b) => b.count - a.count)[0] ?? null;

    const now = new Date();

    let periodTotal: number;
    let daysElapsed: number;
    if (hasRange) {
      periodTotal = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const start = range.from ?? new Date(Math.min(...expenses.map((e) => new Date(e.spent_at).getTime())));
      const end = range.to && range.to < now ? range.to : now;
      daysElapsed = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    } else {
      periodTotal = expenses
        .filter((e) => {
          const d = new Date(e.spent_at);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        })
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      daysElapsed = now.getDate();
    }
    const avgDailySpend = daysElapsed > 0 ? Math.round((periodTotal / daysElapsed) * 100) / 100 : 0;

    return { totalSpent, expenseCount: expenses.length, highestExpense, mostUsedCategory, avgDailySpend };
  }, [expenses, hasRange, range.from, range.to]);

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
