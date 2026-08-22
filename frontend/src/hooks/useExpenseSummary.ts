"use client";

import { useState, useCallback, useEffect } from "react";
import apiFetch from "@/lib/api";

export function useExpenseSummary() {
  const [thisMonth, setThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Must not reject: callers await this after a successful mutation (see the
  // dashboard's onAdd), so a rejection here was reported to the user as
  // "Failed to add expense" for an expense that had in fact been created.
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ this_month: number }>("/api/expenses/summary");
      setThisMonth(data.this_month);
    } catch {
      setError("Failed to load this month's total.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { thisMonth, loading, error, fetchSummary };
}
