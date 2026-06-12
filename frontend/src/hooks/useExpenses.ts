"use client";

import { useState, useEffect, useCallback } from "react";
import apiFetch from "@/lib/api";
import type { Expense, NewExpense, UpdateExpense, PaginationMeta } from "@/lib/types";

export function useExpenses(page = 1, perPage = 15) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Expense[]; meta: PaginationMeta }>(
        `/api/expenses?page=${page}&per_page=${perPage}`
      );
      setExpenses(res.data);
      setMeta(res.meta);
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 401) {
        setError("unauthenticated");
      } else {
        setError("Failed to load expenses. Is the API running?");
      }
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  const addExpense = useCallback(async (data: NewExpense) => {
    const res = await apiFetch<{ data: Expense }>("/api/expenses", {
      method: "POST",
      json: data,
    });
    await fetchExpenses();
    return res.data;
  }, [fetchExpenses]);

  const updateExpense = useCallback(async (id: number, data: UpdateExpense) => {
    const res = await apiFetch<{ data: Expense }>(`/api/expenses/${id}`, {
      method: "PATCH",
      json: data,
    });
    await fetchExpenses();
    return res.data;
  }, [fetchExpenses]);

  const removeExpense = useCallback(async (id: number) => {
    await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
    await fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, meta, loading, error, fetchExpenses, addExpense, updateExpense, removeExpense };
}
