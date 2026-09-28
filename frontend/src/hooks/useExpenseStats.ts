"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import apiFetch from "@/lib/api";
import { EMPTY_FILTERS, toSearchParams, type FilterState } from "@/lib/expenseQuery";
import type { Category, Expense } from "@/lib/types";

export type CategoryRef = Pick<Category, "id" | "name" | "icon" | "color">;

/** GET /api/expenses/stats — aggregates over every expense matching the filters. */
export interface ExpenseStats {
  count: number;
  total: number;
  /** Y-m-d of the earliest / latest matching expense; null when none match. */
  first_date: string | null;
  last_date: string | null;
  highest: Expense | null;
  most_used_category: { category: CategoryRef; count: number } | null;
  /** Largest total first. */
  by_category: { category: CategoryRef; count: number; total: number }[];
  /** Largest total first; the no-method bucket (id/name null) always last. */
  by_payment_method: { id: number | null; name: string | null; total: number }[];
  /** Only days / months that have spending, ascending. Callers fill the gaps. */
  daily: { date: string; total: number }[];
  monthly: { month: string; total: number }[];
}

/**
 * Expense aggregates from the API, refetched when the filters change. Stale
 * responses are dropped, and `refetch()` reloads without clearing the numbers.
 */
export function useExpenseStats(filters: FilterState = EMPTY_FILTERS) {
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const qs = toSearchParams(filters).toString();

  const load = useCallback(async (showLoading: boolean) => {
    const id = ++latest.current;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ExpenseStats>(`/api/expenses/stats${qs ? `?${qs}` : ""}`);
      if (id === latest.current) setStats(res);
    } catch (err) {
      if (id !== latest.current) return;
      setError((err as { status?: number }).status === 401 ? "unauthenticated" : "Failed to load expense stats. Is the API running?");
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [qs]);

  useEffect(() => { load(true); }, [load]);

  const refetch = useCallback(() => load(false), [load]);

  return { stats, loading, error, refetch };
}
