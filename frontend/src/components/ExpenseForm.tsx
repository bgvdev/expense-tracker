"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import Select from "@/components/ui/Select";
import { evaluateAmount, isArithmetic } from "@/lib/calc";
import type { Category, Expense, NewExpense, PaymentMethod, UpdateExpense } from "@/lib/types";

interface CommonProps {
  categories: Category[];
  catLoading: boolean;
  paymentMethods: PaymentMethod[];
  /** Renders a Cancel button next to the submit button. */
  onCancel?: () => void;
}

/**
 * Create and edit share every field, so they share this component. The mode is
 * decided by `expense`: absent means create (and the payload is a NewExpense),
 * present means edit (an UpdateExpense, which may null out the description).
 */
type Props = CommonProps &
  (
    | { expense?: undefined; onSubmit: (data: NewExpense) => Promise<unknown> }
    | { expense: Expense; onSubmit: (data: UpdateExpense) => Promise<unknown> }
  );

const today = () => new Date().toISOString().split("T")[0];

export default function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
  categories,
  catLoading,
  paymentMethods,
}: Props) {
  const isEdit = expense !== undefined;

  const [amount, setAmount]                   = useState(expense ? String(Number(expense.amount)) : "");
  const [categoryId, setCategoryId]           = useState(expense ? String(expense.category.id) : "");
  const [paymentMethodId, setPaymentMethodId] = useState(
    expense?.payment_method?.id ? String(expense.payment_method.id) : ""
  );
  const [description, setDescription]         = useState(expense?.description ?? "");
  const [spentAt, setSpentAt]                 = useState(expense ? expense.spent_at.split("T")[0] : today());
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);

  // Re-seed the fields when the edited expense changes under us.
  useEffect(() => {
    if (!expense) return;
    setAmount(String(Number(expense.amount)));
    setCategoryId(String(expense.category.id));
    setPaymentMethodId(expense.payment_method?.id ? String(expense.payment_method.id) : "");
    setDescription(expense.description ?? "");
    setSpentAt(expense.spent_at.split("T")[0]);
    setFormError(null);
  }, [expense]);

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

  // The field accepts arithmetic ("250+40"), so the value is parsed, not cast.
  const amountValue   = useMemo(() => evaluateAmount(amount), [amount]);
  const showAmountCalc = isArithmetic(amount);
  const amountInvalid  = amount.trim() !== "" && amountValue === null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (amountValue === null) {
      setFormError("Amount must be a number or a sum like 250+40.");
      return;
    }
    if (amountValue < 0.01) {
      setFormError("Amount must be at least 0.01.");
      return;
    }
    setSubmitting(true);
    try {
      await (onSubmit as (data: NewExpense | UpdateExpense) => Promise<unknown>)({
        amount: amountValue,
        category_id: Number(categoryId),
        payment_method_id: paymentMethodId ? Number(paymentMethodId) : null,
        // Creating omits a blank description; editing clears it.
        description: description || (isEdit ? null : undefined),
        spent_at: spentAt,
      });
      if (!isEdit) {
        setAmount("");
        const upi = paymentMethods.find((pm) => pm.slug === "upi");
        setPaymentMethodId(upi ? String(upi.id) : "");
        setDescription("");
        setSpentAt(today());
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const msg =
        Object.values(apiErr.data?.errors ?? {}).flat().join(" ") ||
        apiErr.data?.message ||
        `Failed to ${isEdit ? "update" : "add"} expense.`;
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Memoised so Select's own filtering memo isn't busted by a fresh array each render.
  const categoryOptions = useMemo(
    () => categories.map((c) => ({
      value: String(c.id),
      label: c.name,
      icon: c.icon,
      color: c.color,
    })),
    [categories],
  );
  const paymentOptions = useMemo(
    () => paymentMethods.map((pm) => ({ value: String(pm.id), label: pm.name })),
    [paymentMethods],
  );

  const labelClass = "block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2";
  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 " +
    "focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-label={isEdit ? "Edit expense form" : "Add expense form"}
    >
      {/* Amount */}
      <div>
        <label htmlFor="expense-amount" className={labelClass}>Amount (₹)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">₹</span>
          <input
            id="expense-amount"
            type="text"
            inputMode="text"
            autoComplete="off"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00  or  250+40"
            aria-invalid={amountInvalid}
            aria-describedby="expense-amount-hint"
            className={`${inputClass} pl-10 text-lg font-semibold ${
              amountInvalid ? "border-red-500/50" : ""
            }`}
          />
        </div>
        <p
          id="expense-amount-hint"
          aria-live="polite"
          className={`mt-1.5 text-xs ${amountInvalid ? "text-red-400" : "text-white/40"}`}
        >
          {amountInvalid
            ? "That is not valid arithmetic."
            : showAmountCalc && amountValue !== null
              ? `= ₹${amountValue.toFixed(2)}`
              : "Tip: you can type a sum, e.g. 250+40*2"}
        </p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="expense-category" className={labelClass}>Category</label>
        <Select
          id="expense-category"
          value={categoryId}
          onChange={setCategoryId}
          options={categoryOptions}
          disabled={catLoading}
          placeholder={catLoading ? "Loading…" : "Select a category"}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="expense-description" className={labelClass}>
          Description <span className="normal-case font-normal text-white/30">(optional)</span>
        </label>
        <input
          id="expense-description"
          type="text"
          maxLength={255}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner at the restaurant"
          className={inputClass}
        />
      </div>

      {/* Date */}
      <div>
        <label htmlFor="expense-date" className={labelClass}>Date</label>
        <input
          id="expense-date"
          type="date"
          required
          value={spentAt}
          onChange={(e) => setSpentAt(e.target.value)}
          className={`${inputClass} [color-scheme:dark]`}
        />
      </div>

      {/* Payment Method */}
      {paymentMethods.length > 0 && (
        <div>
          <label htmlFor="expense-payment-method" className={labelClass}>Payment Method</label>
          <Select
            id="expense-payment-method"
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            options={paymentOptions}
            fallbackIcon="credit_card"
            placeholder="Select a payment method"
          />
        </div>
      )}

      {formError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {formError}
        </p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3.5 rounded-xl font-semibold text-sm text-white/60
                       bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          id="expense-submit-btn"
          disabled={submitting}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm tracking-wide
                     bg-gradient-to-r from-indigo-500 to-purple-600
                     hover:from-indigo-400 hover:to-purple-500
                     active:scale-[0.98] transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? "Saving…" : "Adding…"}
            </>
          ) : (
            <>
              <span className="material-symbols-rounded text-lg">{isEdit ? "check" : "add_circle"}</span>
              {isEdit ? "Save Changes" : "Add Expense"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
