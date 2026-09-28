"use client";

import { useState } from "react";
import type { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import EmptyState from "@/components/ui/EmptyState";
import Button, { IconButton } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ConfirmDialog, { ConfirmPreview } from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/ui/Skeleton";
import { Table, THead, TH, THSort, TBody, TR, TD, TActions } from "@/components/ui/Table";
import type { SortKey, SortDir } from "@/lib/expenseQuery";

interface Props {
  expenses: Expense[];
  totalCount: number;
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => Promise<void>;
  onClearFilters?: () => void;
  /**
   * For narrow containers (the dashboard's side-by-side card): never show the
   * Date / Category / Payment columns, whatever the viewport width.
   */
  compact?: boolean;
  /**
   * Sorting state. Pass `onSort` to make the column headers clickable; without
   * it the headers are plain text (the dashboard shows a fixed recent list).
   */
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSort?: (key: SortKey) => void;
}

/** Visibility of a secondary column: from a breakpoint, or never when compact. */
function col(compact: boolean, from: "lg" | "xl") {
  return compact ? { hide: true } : { showFrom: from };
}

function SkeletonRow({ compact }: { compact: boolean }) {
  return (
    <tr>
      <TD {...col(compact, "lg")}><Skeleton className="h-3 w-20" /></TD>
      <TD>
        <div className="flex items-center gap-3">
          <Skeleton className={compact ? "h-9 w-9 rounded-lg" : "h-9 w-9 rounded-lg lg:hidden"} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className={compact ? "h-2.5 w-1/3" : "h-2.5 w-1/3 lg:hidden"} />
          </div>
        </div>
      </TD>
      <TD {...col(compact, "lg")}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-3 w-20" />
        </div>
      </TD>
      <TD {...col(compact, "xl")}><Skeleton className="h-3 w-14" /></TD>
      <TD align="right"><Skeleton className="ml-auto h-3 w-16" /></TD>
      <TD />
    </tr>
  );
}

type SortProps = Pick<Props, "sortKey" | "sortDir" | "onSort">;

const COLUMNS: { key: SortKey; label: string; align?: "right"; vis: (c: boolean) => object }[] = [
  // The sidebar takes 240px from md up, so secondary columns wait for lg / xl.
  { key: "date",        label: "Date",        vis: (c) => col(c, "lg") },
  { key: "description", label: "Description", vis: () => ({}) },
  { key: "category",    label: "Category",    vis: (c) => col(c, "lg") },
  { key: "payment",     label: "Payment",     vis: (c) => col(c, "xl") },
  { key: "amount",      label: "Amount",      align: "right", vis: () => ({}) },
];

function Header({ compact, sortKey, sortDir, onSort }: { compact: boolean } & SortProps) {
  return (
    <THead>
      {COLUMNS.map(({ key, label, align, vis }) =>
        onSort ? (
          <THSort
            key={key}
            {...vis(compact)}
            align={align}
            active={sortKey === key}
            dir={sortKey === key ? (sortDir ?? "desc") : "desc"}
            onSort={() => onSort(key)}
          >
            {label}
          </THSort>
        ) : (
          <TH key={key} {...vis(compact)} align={align}>{label}</TH>
        )
      )}
      <TH align="right"><span className="sr-only">Actions</span></TH>
    </THead>
  );
}

/**
 * One table for every width. Narrow screens drop the Date / Category /
 * Payment columns and show that information under the description instead,
 * so there is a single copy of each row to maintain.
 */
export default function ExpenseList({ expenses, totalCount, loading, onEdit, onDelete, onClearFilters, compact = false, sortKey, sortDir, onSort }: Props) {
  const sortProps: SortProps = { sortKey, sortDir, onSort };
  // The expense awaiting confirmation; the dialog owns the busy/error state.
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  if (loading) {
    return (
      <Table>
        <Header compact={compact} {...sortProps} />
        <TBody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} compact={compact} />)}</TBody>
      </Table>
    );
  }

  if (expenses.length === 0) {
    return totalCount === 0 ? (
      <EmptyState icon="receipt_long" title="No expenses yet" description="Add your first expense to start tracking." />
    ) : (
      <EmptyState
        icon="search_off"
        title="No results match your filters"
        description="Try adjusting or clearing your filters."
        action={onClearFilters && <Button size="sm" onClick={onClearFilters}>Clear filters</Button>}
      />
    );
  }

  return (
    <>
    <ConfirmDialog
      open={pendingDelete !== null}
      onClose={() => setPendingDelete(null)}
      onConfirm={async () => { if (pendingDelete) await onDelete(pendingDelete.id); }}
      title="Delete this expense?"
      description="This permanently removes the expense. It can't be undone."
    >
      {pendingDelete && (
        <ConfirmPreview
          leading={<CategoryIcon icon={pendingDelete.category.icon} color={pendingDelete.category.color} />}
          title={pendingDelete.description ?? pendingDelete.category.name}
          subtitle={`${pendingDelete.category.name} · ${formatDate(pendingDelete.spent_at)}`}
          trailing={<span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(pendingDelete.amount)}</span>}
        />
      )}
    </ConfirmDialog>

    <Table>
      <Header compact={compact} {...sortProps} />
      <TBody>
        {expenses.map((expense) => (
          <TR key={expense.id}>
            <TD {...col(compact, "lg")} className="whitespace-nowrap tabular-nums text-muted">
              {formatDate(expense.spent_at)}
            </TD>
            <TD className="max-w-0 w-full">
              <div className="flex min-w-0 items-center gap-3">
                {/* Only where the Category column is hidden — otherwise the icon shows there. */}
                <CategoryIcon
                  icon={expense.category.icon}
                  color={expense.category.color}
                  className={compact ? undefined : "lg:hidden"}
                />
                <div className="min-w-0">
                  {/* No description means an empty cell, not the category name again. */}
                  {expense.description && (
                    <p className="truncate font-medium text-foreground">{expense.description}</p>
                  )}
                  {/* Columns hidden at this width, folded into one line. The category
                      belongs here too now, since the line above may be absent. */}
                  <p className={compact ? "truncate text-xs text-muted" : "truncate text-xs text-muted lg:hidden"}>
                    {[
                      expense.category.name,
                      formatDate(expense.spent_at),
                      expense.payment_method?.name,
                    ].filter(Boolean).join(" · ")}
                  </p>
                  {!compact && (
                    <p className="hidden truncate text-xs text-muted lg:block xl:hidden">
                      {expense.payment_method?.name}
                    </p>
                  )}
                </div>
              </div>
            </TD>
            <TD {...col(compact, "lg")} className="whitespace-nowrap text-muted">
              <span className="inline-flex items-center gap-2">
                <CategoryIcon icon={expense.category.icon} color={expense.category.color} size="sm" />
                {expense.category.name}
              </span>
            </TD>
            <TD {...col(compact, "xl")} className="whitespace-nowrap">
              {expense.payment_method ? <Badge>{expense.payment_method.name}</Badge> : <span className="text-faint">—</span>}
            </TD>
            <TD align="right" className="whitespace-nowrap font-semibold tabular-nums text-foreground">
              {formatCurrency(expense.amount)}
            </TD>
            <TActions>
              <IconButton icon="edit" label="Edit expense" size="sm" onClick={() => onEdit(expense)} />
              <IconButton icon="delete" label="Delete expense" size="sm" tone="danger" onClick={() => setPendingDelete(expense)} />
            </TActions>
          </TR>
        ))}
      </TBody>
    </Table>
    </>
  );
}
