"use client";

import { useState, useCallback } from "react";
import apiFetch from "@/lib/api";
import { Category, NewCategory, UpdateCategory } from "@/lib/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Category[]>("/api/categories");
      setCategories(data);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (data: NewCategory): Promise<Category> => {
    const created = await apiFetch<Category>("/api/categories", { method: "POST", json: data });
    setCategories((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCategory = useCallback(async (id: number, data: UpdateCategory): Promise<Category> => {
    const updated = await apiFetch<Category>(`/api/categories/${id}`, { method: "PATCH", json: data });
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const removeCategory = useCallback(async (id: number): Promise<void> => {
    await apiFetch<void>(`/api/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, loading, error, fetchCategories, addCategory, updateCategory, removeCategory };
}
