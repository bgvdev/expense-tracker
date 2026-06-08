"use client";

import { useState } from "react";
import { CategoryBreakdownItem } from "@/hooks/useFilteredExpenses";
import type { Category } from "@/lib/types";

interface CategoryBreakdownProps {
  breakdown: CategoryBreakdownItem[];
  filteredTotal: number;
  loading: boolean;
  categories?: Category[];
  onAddCategory?: () => void;
  onEditCategory?: (cat: Category) => void;
  onRemoveCategory?: (id: number) => Promise<void>;
}

export default function CategoryBreakdown({
  breakdown, filteredTotal, loading,
  categories, onAddCategory, onEditCategory, onRemoveCategory,
}: CategoryBreakdownProps) {
  const [confirmId, setConfirmId]   = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (loading) return null;

  const userCategories = categories?.filter((c) => !c.is_global) ?? [];

  async function handleDelete(id: number) {
    if (!onRemoveCategory) return;
    setDeletingId(id);
    try {
      await onRemoveCategory(id);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded text-indigo-400" style={{ fontSize: 20 }}>donut_small</span>
          <span className="text-sm font-semibold text-white/80">Spending by Category</span>
        </div>
        {onAddCategory && (
          <button
            onClick={onAddCategory}
            className="flex items-center gap-1 text-xs text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 15 }}>add</span>
            New Category
          </button>
        )}
      </div>

      <div className="px-5 pb-5 border-t border-white/10">
        {/* Spending bars */}
        {breakdown.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No spending data yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {breakdown.map(({ category, total, count, percentage }) => (
              <div key={category.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: category.color + "33", color: category.color }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{category.icon}</span>
                    </div>
                    <span className="text-sm text-white/70">{category.name}</span>
                    <span className="text-xs text-white/30">({count})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white/80">
                      ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-white/30 ml-2">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: category.color }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-white/40">
              <span>Total shown</span>
              <span>₹{filteredTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Your Categories management */}
        {categories && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Your Categories</p>
            {userCategories.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-2">No custom categories yet.</p>
            ) : (
              <ul className="space-y-1">
                {userCategories.map((cat) => {
                  const isConfirm  = confirmId === cat.id;
                  const isDeleting = deletingId === cat.id;
                  return (
                    <li
                      key={cat.id}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.color + "33", color: cat.color }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 13 }}>{cat.icon}</span>
                      </div>
                      <span className="flex-1 text-xs text-white/70">{cat.name}</span>

                      {isConfirm ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-white/40 hidden sm:inline">Delete?</span>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            disabled={isDeleting}
                            className="px-1.5 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-semibold disabled:opacity-50"
                          >
                            {isDeleting ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/50 text-[11px] font-semibold"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          {onEditCategory && (
                            <button
                              onClick={() => onEditCategory(cat)}
                              className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            >
                              <span className="material-symbols-rounded" style={{ fontSize: 13 }}>edit</span>
                            </button>
                          )}
                          {onRemoveCategory && (
                            <button
                              onClick={() => setConfirmId(cat.id)}
                              className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <span className="material-symbols-rounded" style={{ fontSize: 13 }}>delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
