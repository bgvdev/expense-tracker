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

interface RowActionsProps {
  expense: Expense;
  isConfirming: boolean;
  isDeleting: boolean;
  onEdit: (expense: Expense) => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onDelete: () => void;
}

function RowActions({ expense, isConfirming, isDeleting, onEdit, onConfirm, onCancelConfirm, onDelete }: RowActionsProps) {
  if (isConfirming) {
    return (
      <div className="flex items-center gap-1 ml-1">
        <span className="text-xs text-white/50 hidden sm:inline">Delete?</span>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400
                     text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {isDeleting ? "…" : "Yes"}
        </button>
        <button
          onClick={onCancelConfirm}
          disabled={isDeleting}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50
                     text-xs font-semibold transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 ml-1 rounded-lg bg-white/5 border border-white/10 p-0.5 shrink-0">
      <button
        onClick={() => onEdit(expense)}
        title="Edit expense"
        aria-label="Edit expense"
        className="h-7 w-7 sm:h-8 sm:w-8 rounded-md text-white/55 hover:bg-indigo-500/20 hover:text-indigo-300
                   flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>edit</span>
      </button>
      <span className="w-px h-4 bg-white/10" />
      <button
        onClick={onConfirm}
        title="Delete expense"
        aria-label="Delete expense"
        className="h-7 w-7 sm:h-8 sm:w-8 rounded-md text-white/55 hover:bg-red-500/20 hover:text-red-400
                   flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>delete</span>
      </button>
    </div>
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
    <>
      {/* ── Table layout (sm and up) ── */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-white/40 uppercase tracking-wide">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Description / Category / Payment</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const date = new Date(expense.spent_at);
              const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const isConfirming = confirmId === expense.id;
              const isDeleting   = deletingId === expense.id;

              return (
                <tr
                  key={expense.id}
                  className="group border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-white/50">{formatted}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/90 font-medium">{expense.description ?? "—"}</span>
                      <CategoryBadge
                        name={expense.category.name}
                        icon={expense.category.icon}
                        color={expense.category.color}
                      />
                      {expense.payment_method && (
                        <PaymentMethodBadge name={expense.payment_method.name} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-emerald-400">
                    ₹{Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end">
                      <RowActions
                        expense={expense}
                        isConfirming={isConfirming}
                        isDeleting={isDeleting}
                        onEdit={onEdit}
                        onConfirm={() => setConfirmId(expense.id)}
                        onCancelConfirm={() => setConfirmId(null)}
                        onDelete={() => handleDelete(expense.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Card layout (mobile only) ── */}
      <ul className="sm:hidden space-y-3">
        {expenses.map((expense) => {
          const date = new Date(expense.spent_at);
          const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const isConfirming = confirmId === expense.id;
          const isDeleting   = deletingId === expense.id;

          return (
            <li
              key={expense.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10
                         hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            >
              {/* Category icon circle */}
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
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
                <p className="text-sm font-medium text-white/90 truncate max-w-[120px]">
                  {expense.description ?? "—"}
                </p>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
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
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm font-bold text-emerald-400">
                  ₹{Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>

                <RowActions
                  expense={expense}
                  isConfirming={isConfirming}
                  isDeleting={isDeleting}
                  onEdit={onEdit}
                  onConfirm={() => setConfirmId(expense.id)}
                  onCancelConfirm={() => setConfirmId(null)}
                  onDelete={() => handleDelete(expense.id)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
