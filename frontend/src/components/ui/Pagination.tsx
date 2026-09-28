import type { PaginationMeta } from "@/lib/types";
import { cn } from "@/lib/cn";
import Button from "./Button";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

function buildPageWindows(current: number, last: number): (number | "…")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [];
  const show = new Set<number>();

  show.add(1);
  show.add(last);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= last) show.add(p);
  }

  const sorted = Array.from(show).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    pages.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      pages.push("…");
    }
  }

  return pages;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.last_page <= 1) return null;

  const { current_page: current, last_page: last } = meta;
  const pages = buildPageWindows(current, last);

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        icon="chevron_left"
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
      >
        <span className="hidden sm:inline">Prev</span>
      </Button>

      {/* Numbered pages on desktop */}
      <div className="hidden items-center gap-1 md:flex">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-faint select-none">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => p !== current && onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === current ? "page" : undefined}
              className={cn(
                "h-8 min-w-8 rounded-md px-2 text-xs font-medium tabular-nums transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                p === current
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-subtle hover:text-foreground",
              )}
            >
              {p}
            </button>
          ),
        )}
      </div>

      {/* Compact label on mobile */}
      <span className="px-2 text-xs text-muted tabular-nums md:hidden">
        {current} / {last}
      </span>

      <Button
        size="sm"
        variant="ghost"
        iconRight="chevron_right"
        onClick={() => onPageChange(current + 1)}
        disabled={current === last}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
      </Button>
    </nav>
  );
}
