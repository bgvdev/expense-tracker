"use client";

import { useState, useCallback, useEffect } from "react";
import apiFetch from "@/lib/api";
import type { Expense, NewExpense, UpdateExpense, PaginationMeta } from "@/lib/types";

const FETCH_PER_PAGE = 100;

interface ExpensePage {
  data: Expense[];
  meta: PaginationMeta;
}

/** The server orders by spent_at descending; keep the local copy consistent. */
function bySpentAtDesc(a: Expense, b: Expense): number {
  return new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime();
}

export function useAllExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Page 1 first, because only its meta tells us how many pages there are —
      // then the remainder go out concurrently. The previous version awaited
      // each page before requesting the next, so loading N pages cost N times
      // the round-trip latency (~500ms each against the production backend).
      const first = await apiFetch<ExpensePage>(
        `/api/expenses?page=1&per_page=${FETCH_PER_PAGE}`
      );

      let all = first.data;

      if (first.meta.last_page > 1) {
        const rest = await Promise.all(
          Array.from({ length: first.meta.last_page - 1 }, (_, i) =>
            apiFetch<ExpensePage>(
              `/api/expenses?page=${i + 2}&per_page=${FETCH_PER_PAGE}`
            )
          )
        );
        all = all.concat(...rest.map((page) => page.data));
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

  // The mutators below reconcile the local list from the response body instead
  // of re-running fetchAll(). A full re-sweep after every write meant saving one
  // expense paid for re-downloading the user's entire history, and it grew
  // linearly with that history; the API already returns the affected row with
  // its category and payment_method relations loaded.
  const addExpense = useCallback(async (data: NewExpense) => {
    const res = await apiFetch<{ data: Expense }>("/api/expenses", {
      method: "POST",
      json: data,
    });
    setExpenses((prev) => [res.data, ...prev].sort(bySpentAtDesc));
    return res.data;
  }, []);

  const updateExpense = useCallback(async (id: number, data: UpdateExpense) => {
    const res = await apiFetch<{ data: Expense }>(`/api/expenses/${id}`, {
      method: "PATCH",
      json: data,
    });
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? res.data : e)).sort(bySpentAtDesc)
    );
    return res.data;
  }, []);

  const removeExpense = useCallback(async (id: number) => {
    await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { expenses, loading, error, refetch: fetchAll, addExpense, updateExpense, removeExpense };
}
