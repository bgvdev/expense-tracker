"use client";

import { useState, useEffect, FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import type { Category, Expense, UpdateExpense, PaymentMethod } from "@/lib/types";

interface Props {
  expense: Expense;
  onSave: (id: number, data: UpdateExpense) => Promise<unknown>;
  onClose: () => void;
  categories: Category[];
  catLoading: boolean;
  paymentMethods: PaymentMethod[];
}

export default function EditExpenseModal({ expense, onSave, onClose, categories, catLoading, paymentMethods }: Props) {
  const { showToast } = useToast();

  const [amount, setAmount]                   = useState(String(Number(expense.amount)));
  const [categoryId, setCategoryId]           = useState(String(expense.category.id));
  const [paymentMethodId, setPaymentMethodId] = useState(
    expense.payment_method?.id
      ? String(expense.payment_method.id)
      : String(paymentMethods.find((pm) => pm.slug === "upi")?.id ?? "")
  );
  const [description, setDescription]         = useState(expense.description ?? "");
  const [spentAt, setSpentAt]                 = useState(expense.spent_at.split("T")[0]);
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);

  // Reset when expense changes
  useEffect(() => {
    setAmount(String(Number(expense.amount)));
    setCategoryId(String(expense.category.id));
    const upi = paymentMethods.find((pm) => pm.slug === "upi");
    setPaymentMethodId(
      expense.payment_method?.id
        ? String(expense.payment_method.id)
        : String(upi?.id ?? "")
    );
    setDescription(expense.description ?? "");
    setSpentAt(expense.spent_at.split("T")[0]);
    setFormError(null);
  }, [expense, paymentMethods]);

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
        payment_method_id: paymentMethodId ? Number(paymentMethodId) : null,
        description: description || null,
        spent_at: spentAt,
      });
      showToast("Expense updated successfully!");
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const msg =
        Object.values(apiErr.data?.errors ?? {}).flat().join(" ") ||
        apiErr.data?.message ||
        "Failed to update expense.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCat = categories.find((c) => c.id === Number(categoryId));

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Edit Expense"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-expense-form"
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm
                       bg-gradient-to-r from-indigo-500 to-purple-600
                       hover:from-indigo-400 hover:to-purple-500
                       active:scale-[0.98] transition-all disabled:opacity-60
                       shadow-lg shadow-indigo-500/25"
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
        </>
      }
    >
      <form id="edit-expense-form" onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {formError}
          </p>
        )}

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">₹</span>
            <input
              type="number" step="0.01" min="0.01" required
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
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Category</label>
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
              required value={categoryId}
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
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
            Description <span className="normal-case font-normal text-white/30">(optional)</span>
          </label>
          <input
            type="text" maxLength={255}
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
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Date</label>
          <input
            type="date" required
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
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
              Payment Method
            </label>
            <div className="relative">
              <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" style={{ fontSize: 18 }}>
                credit_card
              </span>
              <select
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
      </form>
    </Modal>
  );
}
