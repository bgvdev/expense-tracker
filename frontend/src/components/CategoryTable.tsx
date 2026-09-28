"use client";

import { plural } from "@/lib/format";
import { IconButton } from "@/components/ui/Button";
import CategoryIcon from "@/components/ui/CategoryIcon";
import Icon from "@/components/ui/Icon";
import { Table, THead, TH, TBody, TR, TD, TActions } from "@/components/ui/Table";

export interface CategoryRow {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface CategoryTableProps<T extends CategoryRow> {
  categories: T[];
  expenseCount: (cat: T) => number;
  /** Omit both handlers for a read-only table (rows show a lock instead). */
  onEdit?: (cat: T) => void;
  onDelete?: (cat: T) => void;
}

/** Shared by the user's categories, the default categories and the admin list. */
export default function CategoryTable<T extends CategoryRow>({ categories, expenseCount, onEdit, onDelete }: CategoryTableProps<T>) {
  const readOnly = !onEdit && !onDelete;

  return (
    <Table fixed>
      <THead>
        <TH className="w-auto">Category</TH>
        {/* Fixed widths so stacked tables (yours / default) line up. */}
        <TH showFrom="sm" className="w-32">Color</TH>
        <TH align="right" className="w-24">Expenses</TH>
        <TH align="right" className="w-24"><span className="sr-only">{readOnly ? "Access" : "Actions"}</span></TH>
      </THead>
      <TBody>
        {categories.map((cat) => {
          const count = expenseCount(cat);
          return (
            <TR key={cat.id}>
              <TD>
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryIcon icon={cat.icon} color={cat.color} />
                  <span className="truncate font-medium text-foreground">{cat.name}</span>
                </div>
              </TD>
              <TD showFrom="sm" className="whitespace-nowrap">
                <span className="inline-flex items-center gap-2 font-mono text-xs uppercase text-muted">
                  <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: cat.color }} />
                  {cat.color}
                </span>
              </TD>
              <TD align="right" className="whitespace-nowrap tabular-nums text-muted">
                {count.toLocaleString()}
              </TD>
              {readOnly ? (
                <TD align="right" className="w-px">
                  <span title="Read-only" className="inline-flex h-7 w-7 items-center justify-center text-faint">
                    <Icon name="lock" size={16} />
                  </span>
                </TD>
              ) : (
                <TActions>
                  {onEdit && <IconButton icon="edit" label={`Edit ${cat.name}`} size="sm" onClick={() => onEdit(cat)} />}
                  {onDelete && (
                    // Deleting is blocked server-side while expenses reference the category.
                    <IconButton
                      icon="delete"
                      size="sm"
                      tone="danger"
                      onClick={() => onDelete(cat)}
                      disabled={count > 0}
                      label={count > 0 ? `Can't delete — ${plural(count, "expense")} use this category` : `Delete ${cat.name}`}
                    />
                  )}
                </TActions>
              )}
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
