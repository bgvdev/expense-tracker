import type { PaginationMeta } from "@/lib/types";

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

const btnBase =
  "h-8 min-w-[2rem] flex items-center justify-center rounded-md border text-sm font-medium transition-colors";
const btnInactive =
  "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10";
const btnActive =
  "border-indigo-500 bg-indigo-500 text-white font-bold";
const btnDisabled =
  "border-gray-200 bg-white text-gray-400 opacity-40 cursor-not-allowed pointer-events-none dark:border-white/10 dark:bg-white/5";

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.last_page <= 1) return null;

  const { current_page: current, last_page: last } = meta;
  const pages = buildPageWindows(current, last);

  return (
    <div className="flex flex-col items-center gap-2 py-2">

      {/* ── Desktop: numbered pills ── */}
      <div className="hidden md:flex items-center gap-1">
        <button
          className={`${btnBase} px-3 ${current === 1 ? btnDisabled : btnInactive}`}
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-400 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`${btnBase} w-8 ${p === current ? btnActive : btnInactive}`}
              onClick={() => p !== current && onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === current ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className={`${btnBase} px-3 ${current === last ? btnDisabled : btnInactive}`}
          onClick={() => onPageChange(current + 1)}
          disabled={current === last}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>

      {/* ── Mobile: compact prev / label / next ── */}
      <div className="flex md:hidden items-center gap-3 w-full">
        <button
          className={`${btnBase} flex-1 px-3 ${current === 1 ? btnDisabled : btnInactive}`}
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
        >
          ← Prev
        </button>
        <span className="text-sm text-gray-500 whitespace-nowrap">
          Page <strong>{current}</strong> of <strong>{last}</strong>
        </span>
        <button
          className={`${btnBase} flex-1 px-3 ${current === last ? btnDisabled : btnInactive}`}
          onClick={() => onPageChange(current + 1)}
          disabled={current === last}
        >
          Next →
        </button>
      </div>

    </div>
  );
}
