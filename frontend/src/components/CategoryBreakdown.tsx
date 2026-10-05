"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryRef } from "@/hooks/useExpenseStats";
import type { Category } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button, { IconButton, buttonClasses } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
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
  /** Show only the biggest N categories, rolling the rest into one row the user can expand. */
  limit?: number;
  categories?: Category[];
  onAddCategory?: () => void;
  onEditCategory?: (cat: Category) => void;
  onRemoveCategory?: (id: number) => Promise<void>;
}

export default function CategoryBreakdown({
  breakdown, filteredTotal, loading, limit,
  categories, onAddCategory, onEditCategory, onRemoveCategory,
}: CategoryBreakdownProps) {
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (loading) return null;

  // Rank by spend so the top-N cut and the stacked bar never depend on the API's order.
  const ranked = [...breakdown].sort((a, b) => b.total - a.total);
  const collapsible = limit !== undefined && ranked.length > limit;
  const top = collapsible ? ranked.slice(0, limit) : ranked;
  const rest = collapsible ? ranked.slice(limit) : [];
  const restTotal = rest.reduce((sum, r) => sum + r.total, 0);
  const restCount = rest.reduce((sum, r) => sum + r.count, 0);
  const restPercentage = rest.reduce((sum, r) => sum + r.percentage, 0);
  const visible = expanded ? ranked : top;

  const userCategories = categories?.filter((c) => !c.is_global) ?? [];

  return (
    <Card>
      <CardHeader
        title="Spending by category"
        description={
          breakdown.length > 0
            ? `${formatCurrency(filteredTotal)} across ${breakdown.length} ${breakdown.length === 1 ? "category" : "categories"}`
            : undefined
        }
        action={
          onAddCategory ? <Button size="sm" icon="add" onClick={onAddCategory}>New category</Button>
          : collapsible ? <Link href="/reports" className={buttonClasses({ variant: "ghost", size: "sm" })}>Reports</Link>
          : undefined
        }
      />

      <CardBody>
        {breakdown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No spending data yet.</p>
        ) : (
          <>
          {collapsible && (
            // The whole distribution at a glance, including the categories folded away below.
            <div className="mb-5 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
              {top.map(({ category, percentage }) => (
                <div key={category.id} className="h-full" style={{ width: `${percentage}%`, backgroundColor: category.color }} />
              ))}
              {restPercentage > 0 && <div className="h-full flex-1 bg-faint/40" />}
            </div>
          )}
          <ul className="space-y-3.5">
            {visible.map(({ category, total, count, percentage }) => (
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

            {collapsible && !expanded && (
              <li>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-subtle text-muted">
                      <Icon name="more_horiz" size={14} />
                    </span>
                    <span className="truncate text-muted">{rest.length} more {rest.length === 1 ? "category" : "categories"}</span>
                    <span className="text-xs text-faint">{restCount}</span>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <span className="font-medium text-muted">{formatCurrency(restTotal)}</span>
                    <span className="ml-2 inline-block w-12 text-xs text-muted">{restPercentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-subtle">
                  <div className="h-1.5 rounded-full bg-faint/40" style={{ width: `${restPercentage}%` }} />
                </div>
              </li>
            )}
          </ul>

          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              iconRight={expanded ? "expand_less" : "expand_more"}
              className="mt-4"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show less" : `Show all ${ranked.length} categories`}
            </Button>
          )}
          </>
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
