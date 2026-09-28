import { cn } from "@/lib/cn";

type Align = "left" | "right" | "center";
/** Hide a column below this breakpoint; its info should reappear elsewhere in the row. */
type Breakpoint = "sm" | "md" | "lg" | "xl";

const alignCls: Record<Align, string> = { left: "text-left", right: "text-right", center: "text-center" };
// Literal class names so Tailwind's scanner keeps them.
const showFrom: Record<Breakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

interface CellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
  showFrom?: Breakpoint;
  /** Never show this column (e.g. a compact variant of the table). */
  hide?: boolean;
}

/** Scroll wrapper + <table>. Put it flush inside a Card for the framed look. */
export function Table({ className, fixed, children }: { className?: string; fixed?: boolean; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      {/* `fixed` honours header widths exactly, so stacked tables line up. */}
      <table className={cn("w-full border-collapse text-sm", fixed && "table-fixed", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-border bg-subtle/40">
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({ align = "left", showFrom: bp, hide, className, children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: Align; showFrom?: Breakpoint; hide?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-4 py-2.5 text-xs font-medium text-muted first:pl-5 last:pr-5",
        alignCls[align],
        bp && showFrom[bp],
        className,
        hide && "hidden",
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

/**
 * A column header that sorts the table. Renders the same `th` as `TH` with a
 * button inside, so the sort affordance is keyboard reachable and screen
 * readers get `aria-sort` on the column itself.
 *
 * The arrow is always in the layout — faint until the column is active — so
 * the header text does not shift when sorting moves between columns.
 */
export function THSort({
  active, dir, onSort, align = "left", showFrom: bp, hide, className, children, ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  active: boolean;
  dir: "asc" | "desc";
  onSort: () => void;
  align?: Align;
  showFrom?: Breakpoint;
  hide?: boolean;
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "whitespace-nowrap px-4 py-2.5 text-xs font-medium first:pl-5 last:pr-5",
        alignCls[align],
        bp && showFrom[bp],
        className,
        hide && "hidden",
      )}
      {...rest}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "group/sort -mx-1 inline-flex items-center gap-1 whitespace-nowrap rounded px-1 py-0.5 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-foreground" : "text-muted hover:text-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        <span>{children}</span>
        <span
          aria-hidden="true"
          className={cn(
            "material-symbols-rounded shrink-0 select-none text-[16px] leading-none transition-opacity",
            active ? "opacity-100" : "opacity-0 group-hover/sort:opacity-40 group-focus-visible/sort:opacity-40",
          )}
        >
          {active && dir === "asc" ? "arrow_upward" : "arrow_downward"}
        </span>
      </button>
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TR({ className, children, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("group transition-colors hover:bg-subtle/50", className)} {...rest}>
      {children}
    </tr>
  );
}

export function TD({ align = "left", showFrom: bp, hide, className, children, ...rest }: CellProps) {
  return (
    <td
      className={cn("px-4 py-3 align-middle first:pl-5 last:pr-5", alignCls[align], bp && showFrom[bp], className, hide && "hidden")}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Row actions cell. Always visible, so the affordance is never hidden. */
export function TActions({ children }: { children: React.ReactNode }) {
  return (
    <TD align="right" className="w-px whitespace-nowrap">
      <div className="flex items-center justify-end">{children}</div>
    </TD>
  );
}
