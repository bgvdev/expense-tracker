/**
 * Expense filters and sorting, and how they become API query parameters.
 *
 * Filtering, sorting and aggregation all happen server-side (GET /api/expenses
 * and GET /api/expenses/stats), so this module only describes *what* to ask
 * for — it never filters a list itself.
 */

export type DatePreset = "all" | "today" | "week" | "month" | "last_month" | "custom";

/** The sortable table columns, by the header they sit under. */
export type SortKey = "date" | "description" | "category" | "payment" | "amount";
export type SortDir = "asc" | "desc";

export interface FilterState {
  search: string;
  categoryIds: number[];
  paymentMethodIds: number[];
  datePreset: DatePreset;
  customFrom: string | null;
  customTo: string | null;
  amountMin: string;
  amountMax: string;
}

export interface SortState {
  sortKey: SortKey;
  sortDir: SortDir;
}

/** No filters at all: every expense the user has. What "Clear all" returns to. */
export const EMPTY_FILTERS: FilterState = {
  search: "",
  categoryIds: [],
  paymentMethodIds: [],
  datePreset: "all",
  customFrom: null,
  customTo: null,
  amountMin: "",
  amountMax: "",
};

/** What the expenses screen opens with: the current month. */
export const DEFAULT_FILTERS: FilterState = { ...EMPTY_FILTERS, datePreset: "month" };

export const DEFAULT_SORT: SortState = { sortKey: "date", sortDir: "desc" };

/**
 * Which way a column sorts when you first click it: text reads naturally A→Z,
 * while dates and amounts are most useful largest-first.
 */
export const DEFAULT_SORT_DIR: Record<SortKey, SortDir> = {
  date: "desc",
  description: "asc",
  category: "asc",
  payment: "asc",
  amount: "desc",
};

/** A local calendar date as Y-m-d — the form the API filters and stores by. */
export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The inclusive calendar-date range a preset stands for, as Y-m-d strings.
 * Computed from the viewer's local calendar, so "this month" means their month.
 */
export function dateBounds(f: Pick<FilterState, "datePreset" | "customFrom" | "customTo">): [string | null, string | null] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (f.datePreset) {
    case "today":
      return [toYmd(now), toYmd(now)];
    case "week":
      return [toYmd(new Date(y, m, now.getDate() - 6)), toYmd(now)];
    case "month":
      return [toYmd(new Date(y, m, 1)), toYmd(new Date(y, m + 1, 0))];
    case "last_month":
      return [toYmd(new Date(y, m - 1, 1)), toYmd(new Date(y, m, 0))];
    case "custom":
      return [f.customFrom || null, f.customTo || null];
    default:
      return [null, null];
  }
}

/** Whether any filter narrows the set. Sorting does not count. */
export function isFiltered(f: FilterState): boolean {
  const [from, to] = dateBounds(f);
  return (
    f.search.trim() !== "" ||
    f.categoryIds.length > 0 ||
    f.paymentMethodIds.length > 0 ||
    from !== null ||
    to !== null ||
    f.amountMin !== "" ||
    f.amountMax !== ""
  );
}

/** Filter + sort + paging as the query-string GET /api/expenses and /stats accept. */
export function toSearchParams(
  f: FilterState,
  opts: { sort?: SortState; page?: number; perPage?: number } = {},
): URLSearchParams {
  const p = new URLSearchParams();
  const [from, to] = dateBounds(f);

  if (f.search.trim()) p.set("search", f.search.trim());
  f.categoryIds.forEach((id) => p.append("category_ids[]", String(id)));
  f.paymentMethodIds.forEach((id) => p.append("payment_method_ids[]", String(id)));
  if (from) p.set("date_from", from);
  if (to) p.set("date_to", to);
  if (f.amountMin !== "") p.set("amount_min", f.amountMin);
  if (f.amountMax !== "") p.set("amount_max", f.amountMax);
  if (opts.sort) {
    p.set("sort", opts.sort.sortKey);
    p.set("dir", opts.sort.sortDir);
  }
  if (opts.page) p.set("page", String(opts.page));
  if (opts.perPage) p.set("per_page", String(opts.perPage));
  return p;
}
