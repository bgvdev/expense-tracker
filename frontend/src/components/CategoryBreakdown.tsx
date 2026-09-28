"use client";

import { useState } from "react";
import type { CategoryRef } from "@/hooks/useExpenseStats";
import type { Category } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button, { IconButton } from "@/components/ui/Button";
import CategoryIcon from "@/components/ui/CategoryIcon";
import ConfirmDialog, { ConfirmPreview } from "@/components/ui/ConfirmDialog";

export interface CategoryBreakdownItem {
  category: CategoryRef;
  total: number;
  count: number;
  percentage: number;
}

/** Stats rows with each category's share of the grand total, as a percentage. */
export function toBreakdown(rows: { category: CategoryRef; count: number; total: number }[], grandTotal: number): CategoryBreakdownItem[] {
  return rows.map((r) => ({ ...r, percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0 }));
}

interface CategoryBreakdownProps {
  breakdown: CategoryBreakdownItem[];
  filteredTotal: number;
  loading: boolean;
  categories?: Category[];
  onAddCategory?: () => void;
  onEditCategory?: (cat: Category) => void;
  onRemoveCategory?: (id: number) => Promise<void>;
}

export default function CategoryBreakdown({
  breakdown, filteredTotal, loading,
  categories, onAddCategory, onEditCategory, onRemoveCategory,
}: CategoryBreakdownProps) {
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  if (loading) return null;

  const userCategories = categories?.filter((c) => !c.is_global) ?? [];

  return (
    <Card>
      <CardHeader
        title="Spending by category"
        description={breakdown.length > 0 ? `${formatCurrency(filteredTotal)} total` : undefined}
        action={onAddCategory && <Button size="sm" icon="add" onClick={onAddCategory}>New category</Button>}
      />

      <CardBody>
        {breakdown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No spending data yet.</p>
        ) : (
          <ul className="space-y-3.5">
            {breakdown.map(({ category, total, count, percentage }) => (
              <li key={category.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                    <span className="truncate text-foreground">{category.name}</span>
                    <span className="text-xs text-faint">{count}</span>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <span className="font-medium text-foreground">{formatCurrency(total)}</span>
                    <span className="ml-2 inline-block w-12 text-xs text-muted">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-subtle">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: category.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {categories && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium text-muted">Your categories</p>
            {userCategories.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted">No custom categories yet.</p>
            ) : (
              <ul className="space-y-0.5">
                {userCategories.map((cat) => (
                  <li key={cat.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-subtle/60">
                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                    <span className="flex-1 truncate text-sm text-foreground">{cat.name}</span>
                    <div className="flex items-center">
                      {onEditCategory && (
                        <IconButton icon="edit" label={`Edit ${cat.name}`} size="sm" onClick={() => onEditCategory(cat)} />
                      )}
                      {onRemoveCategory && (
                        <IconButton icon="delete" label={`Delete ${cat.name}`} size="sm" tone="danger" onClick={() => setPendingDelete(cat)} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardBody>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => { if (pendingDelete) await onRemoveCategory?.(pendingDelete.id); }}
        title="Delete this category?"
        description="This permanently removes the category. It can't be undone."
      >
        {pendingDelete && (
          <ConfirmPreview
            leading={<CategoryIcon icon={pendingDelete.icon} color={pendingDelete.color} />}
            title={pendingDelete.name}
          />
        )}
      </ConfirmDialog>
    </Card>
  );
}
