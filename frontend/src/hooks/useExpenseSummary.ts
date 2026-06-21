"use client";

import { useState, useCallback, useEffect } from "react";
import apiFetch from "@/lib/api";

export function useExpenseSummary() {
  const [thisMonth, setThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ this_month: number }>("/api/expenses/summary");
      setThisMonth(data.this_month);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { thisMonth, loading, fetchSummary };
}
