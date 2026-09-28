"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import apiFetch from "@/lib/api";
import { toSearchParams, type FilterState, type SortState } from "@/lib/expenseQuery";
import type { Expense, NewExpense, UpdateExpense, PaginationMeta } from "@/lib/types";

/** GET /api/expenses meta: pagination plus figures that span every matching row. */
export interface ExpenseListMeta extends PaginationMeta {
  /** Sum of amount over every row matching the filters, not just this page. */
  total_amount: number;
  /** How many expenses the user has at all, ignoring filters. */
  user_total: number;
}

interface ExpensePage {
  data: Expense[];
  meta: ExpenseListMeta;
}

interface Query {
  filters: FilterState;
  sort?: SortState;
  page?: number;
  perPage?: number;
}

function describeError(err: unknown): string {
  return (err as { status?: number }).status === 401
    ? "unauthenticated"
    : "Failed to load expenses. Is the API running?";
}

/**
 * One page of expenses, filtered and sorted by the API.
 *
 * Refetches whenever the query changes. A response that arrives after a newer
 * request was made is dropped, so fast paging or sorting can never leave an
 * older page on screen. `refetch()` reloads in place, keeping the current rows
 * visible (it is what the page calls after a create, edit or delete).
 */
export function useExpenses({ filters, sort, page = 1, perPage = 15 }: Query) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState<ExpenseListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const qs = toSearchParams(filters, { sort, page, perPage }).toString();

  const load = useCallback(async (showLoading: boolean) => {
    const id = ++latest.current;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ExpensePage>(`/api/expenses?${qs}`);
      if (id !== latest.current) return;
      setExpenses(res.data);
      setMeta(res.meta);
    } catch (err) {
      if (id === latest.current) setError(describeError(err));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [qs]);

  useEffect(() => { load(true); }, [load]);

  const refetch = useCallback(() => load(false), [load]);

  return { expenses, meta, loading, error, refetch };
}

/**
 * Every expense matching the filters, in the requested order — for exports.
 * Page 1 first for its last_page, then the rest concurrently.
 */
export async function fetchAllMatching(filters: FilterState, sort?: SortState): Promise<Expense[]> {
  const perPage = 100;
  const url = (page: number) => `/api/expenses?${toSearchParams(filters, { sort, page, perPage })}`;

  const first = await apiFetch<ExpensePage>(url(1));
  if (first.meta.last_page <= 1) return first.data;

  const rest = await Promise.all(
    Array.from({ length: first.meta.last_page - 1 }, (_, i) => apiFetch<ExpensePage>(url(i + 2)))
  );
  return first.data.concat(...rest.map((p) => p.data));
}

/**
 * Create / update / delete. These hold no list state: the list is whatever the
 * API says matches the current filters, so callers refetch after a write.
 */
export function useExpenseMutations() {
  const addExpense = useCallback(async (data: NewExpense) => {
    const res = await apiFetch<{ data: Expense }>("/api/expenses", { method: "POST", json: data });
    return res.data;
  }, []);

  const updateExpense = useCallback(async (id: number, data: UpdateExpense) => {
    const res = await apiFetch<{ data: Expense }>(`/api/expenses/${id}`, { method: "PATCH", json: data });
    return res.data;
  }, []);

  const removeExpense = useCallback(async (id: number) => {
    await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
  }, []);

  return { addExpense, updateExpense, removeExpense };
}
