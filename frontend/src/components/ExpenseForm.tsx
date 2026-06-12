"use client";

import { useState, FormEvent, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import type { Category, NewExpense, PaymentMethod } from "@/lib/types";

interface Props {
  onAdd: (data: NewExpense) => Promise<unknown>;
  categories: Category[];
  catLoading: boolean;
  paymentMethods: PaymentMethod[];
}

export default function ExpenseForm({ onAdd, categories, catLoading, paymentMethods }: Props) {
  const { showToast } = useToast();

  const [amount, setAmount]                   = useState("");
  const [categoryId, setCategoryId]           = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [description, setDescription]         = useState("");
  const [spentAt, setSpentAt]                 = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);

  // Auto-select first category once loaded
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(String(categories[0].id));
    }
  }, [categories, categoryId]);

  // Auto-select UPI as default payment method
  useEffect(() => {
    if (!paymentMethodId && paymentMethods.length > 0) {
      const upi = paymentMethods.find((pm) => pm.slug === "upi");
      if (upi) setPaymentMethodId(String(upi.id));
    }
  }, [paymentMethods, paymentMethodId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!amount || Number(amount) < 0.01) {
      setFormError("Amount must be at least 0.01.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({
        amount: Number(amount),
        category_id: Number(categoryId),
        payment_method_id: paymentMethodId ? Number(paymentMethodId) : null,
        description: description || undefined,
        spent_at: spentAt,
      });
      showToast("Expense added successfully!");
      setAmount("");
      const upi = paymentMethods.find((pm) => pm.slug === "upi");
      setPaymentMethodId(upi ? String(upi.id) : "");
      setDescription("");
      setSpentAt(new Date().toISOString().split("T")[0]);
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const msg =
        Object.values(apiErr.data?.errors ?? {}).flat().join(" ") ||
        apiErr.data?.message ||
        "Failed to add expense.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCat = categories.find((c) => c.id === Number(categoryId));

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Add expense form">
      {/* Amount */}
      <div>
        <label htmlFor="expense-amount" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          Amount (₹)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">₹</span>
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
        <label htmlFor="expense-category" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
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
              <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="expense-description" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          Description <span className="normal-case font-normal text-white/30">(optional)</span>
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
        <label htmlFor="expense-date" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
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
                     transition-all duration-200 [color-scheme:dark]"
        />
      </div>

      {/* Payment Method */}
      {paymentMethods.length > 0 && (
        <div>
          <label htmlFor="expense-payment-method" className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
            Payment Method
          </label>
          <div className="relative">
            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" style={{ fontSize: 18 }}>
              credit_card
            </span>
            <select
              id="expense-payment-method"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white appearance-none
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                         transition-all duration-200"
            >
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id} className="bg-gray-900">{pm.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {formError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {formError}
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
