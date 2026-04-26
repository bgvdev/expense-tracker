"use client";

import { useState, useEffect, FormEvent } from "react";
import apiFetch from "@/lib/api";
import type { Category, NewExpense } from "@/lib/types";

interface Props {
  onAdd: (data: NewExpense) => Promise<unknown>;
}

export default function ExpenseForm({ onAdd }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [spentAt, setSpentAt] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Category[]>("/api/categories")
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setCategoryId(String(data[0].id));
      })
      .catch(() => setFormError("Could not load categories."))
      .finally(() => setCatLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);
    if (!amount || Number(amount) < 0.01) {
      setFormError("Amount must be at least 0.01.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({
        amount: Number(amount),
        category_id: Number(categoryId),
        description: description || undefined,
        spent_at: spentAt,
      });
      setSuccess(true);
      setAmount("");
      setDescription("");
      setSpentAt(new Date().toISOString().split("T")[0]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiErr = err as {
        data?: { message?: string; errors?: Record<string, string[]> };
      };
      const msg =
        apiErr.data?.message ??
        Object.values(apiErr.data?.errors ?? {})
          .flat()
          .join(" ") ??
        "Failed to add expense.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCat = categories.find((c) => c.id === Number(categoryId));

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-label="Add expense form"
    >
      {/* Amount */}
      <div>
        <label
          htmlFor="expense-amount"
          className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2"
        >
          Amount (₹)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">
            ₹
          </span>
          <input
            id="expense-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                       text-white placeholder-white/25 text-lg font-semibold
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                       transition-all duration-200"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="expense-category"
          className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2"
        >
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
            id="expense-category"
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
        <label
          htmlFor="expense-description"
          className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2"
        >
          Description{" "}
          <span className="normal-case font-normal text-white/30">(optional)</span>
        </label>
        <input
          id="expense-description"
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
        <label
          htmlFor="expense-date"
          className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2"
        >
          Date
        </label>
        <input
          id="expense-date"
          type="date"
          required
          value={spentAt}
          onChange={(e) => setSpentAt(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-white
                     focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                     transition-all duration-200
                     [color-scheme:dark]"
        />
      </div>

      {/* Feedback */}
      {formError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {formError}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="material-symbols-rounded text-base">check_circle</span>
          Expense added successfully!
        </p>
      )}

      <button
        type="submit"
        id="expense-submit-btn"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide
                   bg-gradient-to-r from-indigo-500 to-purple-600
                   hover:from-indigo-400 hover:to-purple-500
                   active:scale-[0.98] transition-all duration-200
                   disabled:opacity-60 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Adding…
          </>
        ) : (
          <>
            <span className="material-symbols-rounded text-lg">add_circle</span>
            Add Expense
          </>
        )}
      </button>
    </form>
  );
}
