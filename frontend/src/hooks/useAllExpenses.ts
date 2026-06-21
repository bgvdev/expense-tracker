"use client";

import { useState, useCallback, useEffect } from "react";
import apiFetch from "@/lib/api";
import type { Expense, NewExpense, UpdateExpense, PaginationMeta } from "@/lib/types";

const FETCH_PER_PAGE = 100;

export function useAllExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let page = 1;
      let all: Expense[] = [];
      while (true) {
        const res = await apiFetch<{ data: Expense[]; meta: PaginationMeta }>(
          `/api/expenses?page=${page}&per_page=${FETCH_PER_PAGE}`
        );
        all = all.concat(res.data);
        if (page >= res.meta.last_page) break;
        page += 1;
      }
      setExpenses(all);
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
  }, []);

  const addExpense = useCallback(async (data: NewExpense) => {
    const res = await apiFetch<{ data: Expense }>("/api/expenses", {
      method: "POST",
      json: data,
    });
    await fetchAll();
    return res.data;
  }, [fetchAll]);

  const updateExpense = useCallback(async (id: number, data: UpdateExpense) => {
    const res = await apiFetch<{ data: Expense }>(`/api/expenses/${id}`, {
      method: "PATCH",
      json: data,
    });
    await fetchAll();
    return res.data;
  }, [fetchAll]);

  const removeExpense = useCallback(async (id: number) => {
    await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
    await fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { expenses, loading, error, refetch: fetchAll, addExpense, updateExpense, removeExpense };
}
