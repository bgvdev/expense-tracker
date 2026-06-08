"use client";

import { useState, useEffect, useCallback } from "react";
import apiFetch from "@/lib/api";
import type { Expense, NewExpense, UpdateExpense } from "@/lib/types";

export function useExpenses() {
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
    setExpenses((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const updateExpense = useCallback(async (id: number, data: UpdateExpense) => {
    const res = await apiFetch<{ data: Expense }>(`/api/expenses/${id}`, {
      method: "PATCH",
      json: data,
    });
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? res.data : e))
    );
    return res.data;
  }, []);

  const removeExpense = useCallback(async (id: number) => {
    await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, error, fetchExpenses, addExpense, updateExpense, removeExpense };
}
