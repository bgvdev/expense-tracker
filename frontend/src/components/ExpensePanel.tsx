"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import Select from "@/components/ui/Select";
import SidePanel from "@/components/ui/SidePanel";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/format";
import { evaluateAmount, isArithmetic } from "@/lib/calc";
import type { Category, Expense, NewExpense, PaymentMethod, UpdateExpense } from "@/lib/types";

interface CommonProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  catLoading: boolean;
  paymentMethods: PaymentMethod[];
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

export default function ExpensePanel({
  open,
  onClose,
  expense,
  onSubmit,
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

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit expense" : "New expense"}
      description={isEdit ? "Update the details of this expense" : "Record a new expense"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            form="expense-form"
            id="expense-submit-btn"
            variant="primary"
            loading={submitting}
          >
            {submitting ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save changes" : "Add expense"}
          </Button>
        </>
      }
    >
    <form
      id="expense-form"
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-label={isEdit ? "Edit expense form" : "Add expense form"}
    >
      <Field
        label="Amount"
        htmlFor="expense-amount"
        hintId="expense-amount-hint"
        error={amountInvalid ? "That is not valid arithmetic." : undefined}
        hint={
          showAmountCalc && amountValue !== null
            ? `= ${formatCurrency(amountValue)}`
            : "Tip: you can type a sum, e.g. 250+40*2"
        }
      >
        <Input
          id="expense-amount"
          type="text"
          inputMode="text"
          autoComplete="off"
          required
          size="lg"
          prefix="₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00  or  250+40"
          invalid={amountInvalid}
          aria-describedby="expense-amount-hint"
          className="text-base font-medium tabular-nums"
        />
      </Field>

      <Field label="Category" htmlFor="expense-category">
        <Select
          id="expense-category"
          value={categoryId}
          onChange={setCategoryId}
          options={categoryOptions}
          disabled={catLoading}
          placeholder={catLoading ? "Loading…" : "Select a category"}
        />
      </Field>

      <Field label="Description" htmlFor="expense-description" optional>
        <Input
          id="expense-description"
          type="text"
          maxLength={255}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner at the restaurant"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="expense-date">
          <Input
            id="expense-date"
            type="date"
            required
            value={spentAt}
            onChange={(e) => setSpentAt(e.target.value)}
          />
        </Field>

        {paymentMethods.length > 0 && (
          <Field label="Payment method" htmlFor="expense-payment-method">
            <Select
              id="expense-payment-method"
              value={paymentMethodId}
              onChange={setPaymentMethodId}
              options={paymentOptions}
              fallbackIcon="credit_card"
              placeholder="Select a method"
            />
          </Field>
        )}
      </div>

      {formError && <Alert>{formError}</Alert>}

    </form>
    </SidePanel>
  );
}
