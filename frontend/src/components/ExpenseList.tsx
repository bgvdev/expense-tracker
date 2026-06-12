"use client";

import { useState } from "react";
import type { Expense } from "@/lib/types";
import EmptyState from "@/components/EmptyState";

interface Props {
  expenses: Expense[];
  totalCount: number;
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => Promise<void>;
  onClearFilters?: () => void;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-2.5 bg-white/5 rounded w-1/5" />
      </div>
      <div className="h-4 bg-white/10 rounded w-16" />
    </div>
  );
}

function CategoryBadge({ name, icon, color }: { name: string; icon: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 13 }}>{icon}</span>
      <span className="hidden sm:inline">{name}</span>
    </span>
  );
}

function PaymentMethodBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/8 text-white/50 border border-white/10">
      <span className="material-symbols-rounded" style={{ fontSize: 12 }}>credit_card</span>
      <span className="hidden sm:inline">{name}</span>
    </span>
  );
}

export default function ExpenseList({ expenses, totalCount, loading, onEdit, onDelete, onClearFilters }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId]   = useState<number | null>(null);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (expenses.length === 0) {
    return totalCount === 0
      ? <EmptyState type="no-expenses" />
      : <EmptyState type="no-results" onClearFilters={onClearFilters} />;
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => {
        const date = new Date(expense.spent_at);
        const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const isConfirming = confirmId === expense.id;
        const isDeleting   = deletingId === expense.id;

        return (
          <li
            key={expense.id}
            className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10
                       hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            {/* Category icon circle */}
            <div
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${expense.category.color}33` }}
            >
              <span
                className="material-symbols-rounded"
                style={{ color: expense.category.color, fontSize: 18 }}
              >
                {expense.category.icon}
              </span>
            </div>

            {/* Description + category */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate max-w-[120px] sm:max-w-none">
                {expense.description ?? "—"}
              </p>
              <div className="mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <CategoryBadge
                  name={expense.category.name}
                  icon={expense.category.icon}
                  color={expense.category.color}
                />
                {expense.payment_method && (
                  <PaymentMethodBadge name={expense.payment_method.name} />
                )}
                <span className="text-xs text-white/30">{formatted}</span>
              </div>
            </div>

            {/* Amount + actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-sm sm:text-base font-bold text-emerald-400">
                ₹{Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>

              {isConfirming ? (
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-xs text-white/50 hidden sm:inline">Delete?</span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={isDeleting}
                    className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400
                               text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "…" : "Yes"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    disabled={isDeleting}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50
                               text-xs font-semibold transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                /* Always visible on mobile (< sm), hover-only on desktop */
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1">
                  <button
                    onClick={() => onEdit(expense)}
                    title="Edit expense"
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400
                               text-white/40 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>edit</span>
                  </button>
                  <button
                    onClick={() => setConfirmId(expense.id)}
                    title="Delete expense"
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400
                               text-white/40 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>delete</span>
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
