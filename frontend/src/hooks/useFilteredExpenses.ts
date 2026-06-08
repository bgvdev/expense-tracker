"use client";

import { useMemo } from "react";
import { Expense, Category } from "@/lib/types";

export type DatePreset = "all" | "today" | "week" | "month" | "last_month" | "custom";

export interface FilterState {
  search: string;
  categoryIds: number[];
  datePreset: DatePreset;
  customFrom: string | null;
  customTo: string | null;
  sort: "newest" | "oldest" | "highest" | "lowest";
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  categoryIds: [],
  datePreset: "all",
  customFrom: null,
  customTo: null,
  sort: "newest",
};

export interface CategoryBreakdownItem {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

function getDateBounds(preset: DatePreset, customFrom: string | null, customTo: string | null): [Date | null, Date | null] {
  const now = new Date();

  if (preset === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return [start, end];
  }
  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return [start, end];
  }
  if (preset === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return [start, end];
  }
  if (preset === "custom") {
    const start = customFrom ? new Date(customFrom + "T00:00:00") : null;
    const end   = customTo   ? new Date(customTo   + "T23:59:59") : null;
    return [start, end];
  }
  return [null, null];
}

export function useFilteredExpenses(expenses: Expense[], filters: FilterState) {
  const isFiltered = useMemo(() =>
    filters.search !== "" ||
    filters.categoryIds.length > 0 ||
    filters.datePreset !== "all" ||
    filters.sort !== "newest",
  [filters]);

  const [dateFrom, dateTo] = useMemo(
    () => getDateBounds(filters.datePreset, filters.customFrom, filters.customTo),
    [filters.datePreset, filters.customFrom, filters.customTo]
  );

  const filtered = useMemo(() => {
    let result = expenses.filter((e) => {
      // Text search
      if (filters.search) {
        const hay = (e.description ?? "").toLowerCase();
        if (!hay.includes(filters.search.toLowerCase())) return false;
      }
      // Category
      if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(e.category.id)) return false;
      // Date
      if (dateFrom || dateTo) {
        const d = new Date(e.spent_at);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo   && d > dateTo)   return false;
      }
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      if (filters.sort === "newest")  return new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime();
      if (filters.sort === "oldest")  return new Date(a.spent_at).getTime() - new Date(b.spent_at).getTime();
      if (filters.sort === "highest") return Number(b.amount) - Number(a.amount);
      if (filters.sort === "lowest")  return Number(a.amount) - Number(b.amount);
      return 0;
    });

    return result;
  }, [expenses, filters.search, filters.categoryIds, dateFrom, dateTo, filters.sort]);

  const filteredTotal = useMemo(() => filtered.reduce((sum, e) => sum + Number(e.amount), 0), [filtered]);

  const categoryBreakdown = useMemo((): CategoryBreakdownItem[] => {
    const map = new Map<number, CategoryBreakdownItem>();
    for (const e of filtered) {
      const existing = map.get(e.category.id);
      if (existing) {
        existing.total += Number(e.amount);
        existing.count += 1;
      } else {
        map.set(e.category.id, { category: e.category, total: Number(e.amount), count: 1, percentage: 0 });
      }
    }
    const items = Array.from(map.values()).sort((a, b) => b.total - a.total);
    if (filteredTotal > 0) {
      items.forEach((item) => { item.percentage = (item.total / filteredTotal) * 100; });
    }
    return items;
  }, [filtered, filteredTotal]);

  return {
    filtered,
    filteredTotal,
    filteredCount: filtered.length,
    categoryBreakdown,
    isFiltered,
  };
}
