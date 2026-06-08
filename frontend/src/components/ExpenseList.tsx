"use client";

import { useState } from "react";
import type { Expense, UpdateExpense } from "@/lib/types";

interface Props {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => Promise<void>;
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <span className="material-symbols-rounded text-[14px]">{icon}</span>
      {name}
    </span>
  );
}

export default function ExpenseList({ expenses, loading, onEdit, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

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
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="material-symbols-rounded text-5xl text-white/20 mb-3">receipt_long</span>
        <p className="text-white/40 text-sm">No expenses yet.</p>
        <p className="text-white/25 text-xs mt-1">Use the form to add your first expense.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => {
        const date = new Date(expense.spent_at);
        const formatted = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const isConfirming = confirmId === expense.id;
        const isDeleting = deletingId === expense.id;

        return (
          <li
            key={expense.id}
            className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10
                       hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            {/* Category icon circle */}
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${expense.category.color}33` }}
            >
              <span
                className="material-symbols-rounded text-xl"
                style={{ color: expense.category.color }}
              >
                {expense.category.icon}
              </span>
            </div>

            {/* Description + category */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">
                {expense.description ?? "—"}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <CategoryBadge
                  name={expense.category.name}
                  icon={expense.category.icon}
                  color={expense.category.color}
                />
                <span className="text-xs text-white/30">{formatted}</span>
              </div>
            </div>

            {/* Amount + actions */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-base font-bold text-emerald-400">
                ₹{Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>

              {isConfirming ? (
                /* Inline delete confirmation */
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-xs text-white/50 mr-1">Delete?</span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={isDeleting}
                    className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400
                               text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "…" : "Yes"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    disabled={isDeleting}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50
                               text-xs font-semibold transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                /* Edit / Delete buttons — visible on hover */
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button
                    onClick={() => onEdit(expense)}
                    title="Edit expense"
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400
                               text-white/40 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-rounded text-base">edit</span>
                  </button>
                  <button
                    onClick={() => setConfirmId(expense.id)}
                    title="Delete expense"
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400
                               text-white/40 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-rounded text-base">delete</span>
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
