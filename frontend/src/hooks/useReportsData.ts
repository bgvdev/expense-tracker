"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import apiFetch from "@/lib/api";
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
  highestExpense: Expense | null;
  mostUsedCategory: { category: Category; count: number } | null;
  avgDailySpend: number;
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

export function useReportsData(): ReportsData {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Expense[] }>("/api/expenses");
      setExpenses(res.data);
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 401) {
        setError("unauthenticated");
      } else {
        setError("Failed to load expenses.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const monthlySpending = useMemo<MonthlyDataPoint[]>(() => {
    const now = new Date();
    const keyToLabel = new Map<string, string>();
    const totals = new Map<string, number>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      keyToLabel.set(key, d.toLocaleString("en-IN", { month: "short", year: "numeric" }));
      totals.set(key, 0);
    }

    for (const expense of expenses) {
      const d = new Date(expense.spent_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + parseFloat(expense.amount));
    }

    return Array.from(keyToLabel.entries()).map(([key, month]) => ({
      month,
      total: Math.round((totals.get(key) ?? 0) * 100) / 100,
    }));
  }, [expenses]);

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
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: DailyDataPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
      day: String(i + 1),
      total: 0,
    }));

    for (const expense of expenses) {
      const d = new Date(expense.spent_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const idx = d.getDate() - 1;
        days[idx].total += parseFloat(expense.amount);
      }
    }

    return days.map((d) => ({ ...d, total: Math.round(d.total * 100) / 100 }));
  }, [expenses]);

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
    if (expenses.length === 0) {
      return { highestExpense: null, mostUsedCategory: null, avgDailySpend: 0 };
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
    const daysElapsed = now.getDate();
    const thisMonthTotal = expenses
      .filter((e) => {
        const d = new Date(e.spent_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const avgDailySpend = daysElapsed > 0 ? Math.round((thisMonthTotal / daysElapsed) * 100) / 100 : 0;

    return { highestExpense, mostUsedCategory, avgDailySpend };
  }, [expenses]);

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
