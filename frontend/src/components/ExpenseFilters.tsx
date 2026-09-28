"use client";

import { useState, useEffect, useMemo } from "react";
import { Category, PaymentMethod } from "@/lib/types";
import { EMPTY_FILTERS, type FilterState, type DatePreset } from "@/lib/expenseQuery";
import { cn } from "@/lib/cn";
import Chip from "@/components/ui/Chip";
import Input from "@/components/ui/Input";
import Button, { IconButton } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import SidePanel from "@/components/ui/SidePanel";
import MultiSelect from "@/components/ui/MultiSelect";
import Icon from "@/components/ui/Icon";

interface ExpenseFiltersProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  /** The filters currently applied (the ones the list was fetched with). */
  filters: FilterState;
  /** Commit a new set of filters; the page refetches from the API. */
  onApply: (filters: FilterState) => void;
}

/** Why a draft can't be applied yet, or null. Mirrors the API's own 422 rules. */
function draftProblem(f: FilterState): string | null {
  if (f.datePreset === "custom" && f.customFrom && f.customTo && f.customFrom > f.customTo) {
    return "The start date is after the end date.";
  }
  if (f.amountMin !== "" && f.amountMax !== "" && Number(f.amountMin) > Number(f.amountMax)) {
    return "The minimum amount is above the maximum.";
  }
  return null;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all",        label: "All time" },
  { value: "today",      label: "Today" },
  { value: "week",       label: "This week" },
  { value: "month",      label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom",     label: "Custom…" },
];

// ── Drawer content (defined outside to avoid re-mounting) ──────────────────
interface DrawerContentProps {
  filters: FilterState;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onChange: (f: FilterState) => void;
}

function DrawerContent({ filters, categories, paymentMethods, onChange }: DrawerContentProps) {
  // Memoised so MultiSelect's own filtering memo isn't busted every render.
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name, color: c.color })),
    [categories],
  );
  const paymentOptions = useMemo(
    () => paymentMethods.map((pm) => ({ value: String(pm.id), label: pm.name })),
    [paymentMethods],
  );

  return (
    <div className="flex flex-col gap-5">

      <FilterSection title="Date range">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map(({ value, label }) => (
            <Chip key={value} selected={filters.datePreset === value} onClick={() => onChange({ ...filters, datePreset: value })}>
              {label}
            </Chip>
          ))}
        </div>
        {filters.datePreset === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="filter-from">
              <Input
                id="filter-from"
                type="date"
                size="sm"
                value={filters.customFrom ?? ""}
                onChange={(e) => onChange({ ...filters, customFrom: e.target.value || null })}
              />
            </Field>
            <Field label="To" htmlFor="filter-to">
              <Input
                id="filter-to"
                type="date"
                size="sm"
                value={filters.customTo ?? ""}
                onChange={(e) => onChange({ ...filters, customTo: e.target.value || null })}
              />
            </Field>
          </div>
        )}
      </FilterSection>

      <FilterSection title="Amount range">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="number" min="0" placeholder="Min" prefix="₹" size="sm"
              aria-label="Minimum amount"
              value={filters.amountMin}
              onChange={(e) => onChange({ ...filters, amountMin: e.target.value })}
            />
          </div>
          <span className="shrink-0 text-sm text-faint">–</span>
          <div className="flex-1">
            <Input
              type="number" min="0" placeholder="Max" prefix="₹" size="sm"
              aria-label="Maximum amount"
              value={filters.amountMax}
              onChange={(e) => onChange({ ...filters, amountMax: e.target.value })}
            />
          </div>
        </div>
      </FilterSection>

      {categories.length > 0 && (
        <FilterSection title="Categories" htmlFor="filter-categories">
          <MultiSelect
            id="filter-categories"
            values={filters.categoryIds.map(String)}
            onChange={(v) => onChange({ ...filters, categoryIds: v.map(Number) })}
            options={categoryOptions}
            placeholder="All categories"
            searchPlaceholder="Search categories…"
            noun="categories"
          />
        </FilterSection>
      )}

      {paymentMethods.length > 0 && (
        <FilterSection title="Payment method" htmlFor="filter-payment-methods">
          <MultiSelect
            id="filter-payment-methods"
            values={filters.paymentMethodIds.map(String)}
            onChange={(v) => onChange({ ...filters, paymentMethodIds: v.map(Number) })}
            options={paymentOptions}
            placeholder="All payment methods"
            searchPlaceholder="Search payment methods…"
            noun="methods"
          />
        </FilterSection>
      )}

    </div>
  );
}

function FilterSection({ title, htmlFor, children }: { title: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      {htmlFor
        ? <label htmlFor={htmlFor} className="mb-2 block text-xs font-medium text-muted">{title}</label>
        : <p className="mb-2 text-xs font-medium text-muted">{title}</p>}
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
/**
 * Nothing here filters as you type. The side panel edits a draft that only
 * reaches the API on Apply, and search is sent on Enter or the arrow button —
 * each of those is one request, instead of one per keystroke or chip click.
 * Removing an applied chip is itself an explicit action, so it applies at once.
 */
export default function ExpenseFilters({ categories, paymentMethods, filters, onApply }: ExpenseFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(filters);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Follow the applied search when it changes from outside (e.g. "Clear all").
  useEffect(() => { setSearchInput(filters.search); }, [filters.search]);

  const openDrawer = () => {
    setDraft(filters); // start from what is applied; closing discards edits
    setDrawerOpen(true);
  };

  const apply = (next: FilterState) => onApply({ ...next, search: next.search.trim() });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() !== filters.search) apply({ ...filters, search: searchInput });
  };

  const clearAll = () => {
    setSearchInput("");
    apply(EMPTY_FILTERS);
  };

  const problem = draftProblem(draft);

  // Count of applied non-search filters (for the badge on the button)
  const activeFilterCount =
    (filters.categoryIds.length > 0 ? 1 : 0) +
    (filters.paymentMethodIds.length > 0 ? 1 : 0) +
    (filters.datePreset !== "all" ? 1 : 0) +
    (filters.amountMin !== "" || filters.amountMax !== "" ? 1 : 0);

  // Active badge data
  const activeBadges: { key: string; label: string; icon?: string; color?: string; onRemove: () => void }[] = [];

  if (filters.search) {
    activeBadges.push({
      key: "search", label: `“${filters.search}”`, icon: "search",
      onRemove: () => { setSearchInput(""); apply({ ...filters, search: "" }); },
    });
  }
  if (filters.datePreset !== "all") {
    const custom = [filters.customFrom, filters.customTo].filter(Boolean).join(" – ");
    const label = filters.datePreset === "custom" && custom
      ? custom
      : DATE_PRESETS.find((p) => p.value === filters.datePreset)?.label ?? filters.datePreset;
    activeBadges.push({
      key: "date", label, icon: "calendar_month",
      onRemove: () => apply({ ...filters, datePreset: "all", customFrom: null, customTo: null }),
    });
  }
  filters.categoryIds.forEach((id) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) activeBadges.push({
      key: `cat-${id}`, label: cat.name, color: cat.color,
      onRemove: () => apply({ ...filters, categoryIds: filters.categoryIds.filter((c) => c !== id) }),
    });
  });
  filters.paymentMethodIds.forEach((id) => {
    const pm = paymentMethods.find((p) => p.id === id);
    if (pm) activeBadges.push({
      key: `pm-${id}`, label: pm.name, icon: "credit_card",
      onRemove: () => apply({ ...filters, paymentMethodIds: filters.paymentMethodIds.filter((p) => p !== id) }),
    });
  });
  if (filters.amountMin !== "" || filters.amountMax !== "") {
    const label =
      filters.amountMin && filters.amountMax ? `₹${filters.amountMin}–₹${filters.amountMax}` :
      filters.amountMin ? `≥ ₹${filters.amountMin}` :
      `≤ ₹${filters.amountMax}`;
    activeBadges.push({
      key: "amount", label, icon: "currency_rupee",
      onRemove: () => apply({ ...filters, amountMin: "", amountMax: "" }),
    });
  }

  return (
    <div>
      {/* Active filters read left-to-right; the controls sit out of the way on the right. */}
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {activeBadges.map((badge) => (
            <Chip
              key={badge.key}
              removable
              color={badge.color}
              icon={badge.color ? undefined : badge.icon}
              onClick={badge.onRemove}
              aria-label={`Remove filter: ${badge.label}`}
              className="shrink-0"
            >
              {badge.label}
            </Chip>
          ))}
          {activeBadges.length > 1 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="shrink-0">Clear all</Button>
          )}
        </div>

        <form role="search" onSubmit={submitSearch} className="w-40 shrink-0 sm:w-60">
          <Input
            type="text" placeholder="Search…" icon="search" size="sm"
            aria-label="Search expenses"
            enterKeyHint="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            trailing={
              <IconButton type="submit" icon="arrow_forward" label="Search" size="sm" className="h-6 w-6" />
            }
          />
        </form>

        <button
          type="button"
          onClick={openDrawer}
          aria-haspopup="dialog"
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            drawerOpen || activeFilterCount > 0
              ? "border-foreground/30 bg-subtle text-foreground"
              : "border-border bg-surface text-muted hover:text-foreground",
          )}
        >
          <Icon name="tune" size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold leading-none text-background">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Edits here are a draft: nothing is fetched until Apply. */}
      <SidePanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        description={problem ?? "Choose filters, then apply them to the list."}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft({ ...EMPTY_FILTERS, search: draft.search })}>
              Reset
            </Button>
            <Button
              variant="primary"
              disabled={problem !== null}
              onClick={() => { apply({ ...draft, search: filters.search }); setDrawerOpen(false); }}
            >
              Apply
            </Button>
          </>
        }
      >
        <DrawerContent filters={draft} categories={categories} paymentMethods={paymentMethods} onChange={setDraft} />
      </SidePanel>
    </div>
  );
}
