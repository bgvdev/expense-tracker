"use client";

import { useState, useEffect, FormEvent } from "react";
import apiFetch from "@/lib/api";
import type { Category, Expense, UpdateExpense } from "@/lib/types";

interface Props {
  expense: Expense;
  onSave: (id: number, data: UpdateExpense) => Promise<unknown>;
  onClose: () => void;
}

export default function EditExpenseModal({ expense, onSave, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  const [amount, setAmount] = useState(String(Number(expense.amount)));
  const [categoryId, setCategoryId] = useState(String(expense.category.id));
  const [description, setDescription] = useState(expense.description ?? "");
  const [spentAt, setSpentAt] = useState(expense.spent_at.split("T")[0]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>("/api/categories")
      .then((data) => setCategories(data))
      .catch(() => setFormError("Could not load categories."))
      .finally(() => setCatLoading(false));
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!amount || Number(amount) < 0.01) {
      setFormError("Amount must be at least 0.01.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(expense.id, {
        amount: Number(amount),
        category_id: Number(categoryId),
        description: description || null,
        spent_at: spentAt,
      });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as {
        data?: { message?: string; errors?: Record<string, string[]> };
      };
      const msg =
        apiErr.data?.message ??
        Object.values(apiErr.data?.errors ?? {})
          .flat()
          .join(" ") ??
        "Failed to update expense.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCat = categories.find((c) => c.id === Number(categoryId));

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="w-full max-w-md rounded-2xl bg-[#0f1117] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <span className="material-symbols-rounded text-indigo-400 text-xl">edit</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Edit Expense</h2>
              <p className="text-xs text-white/35">Update the details below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-rounded text-white/50 text-lg">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white text-lg font-semibold
                           focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                           transition-all duration-200"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
              Category
            </label>
            <div className="relative">
              {selectedCat && (
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-rounded text-lg pointer-events-none"
                  style={{ color: selectedCat.color }}
                >
                  {selectedCat.icon}
                </span>
              )}
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={catLoading}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white appearance-none
                           focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                           transition-all duration-200 disabled:opacity-50"
              >
                {catLoading && <option>Loading…</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
              Description{" "}
              <span className="normal-case font-normal text-white/30">(optional)</span>
            </label>
            <input
              type="text"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at the restaurant"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-white/25
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                         transition-all duration-200"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
              Date
            </label>
            <input
              type="date"
              required
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                         transition-all duration-200 [color-scheme:dark]"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {formError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white/60
                         bg-white/5 hover:bg-white/10 border border-white/10
                         transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl font-bold text-sm
                         bg-gradient-to-r from-indigo-500 to-purple-600
                         hover:from-indigo-400 hover:to-purple-500
                         active:scale-[0.98] transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded text-lg">check</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
