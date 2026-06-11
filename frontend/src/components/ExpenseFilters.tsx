"use client";

import { useState, useEffect, useRef } from "react";
import { Category } from "@/lib/types";
import { FilterState, DEFAULT_FILTERS, DatePreset } from "@/hooks/useFilteredExpenses";

interface ExpenseFiltersProps {
  categories: Category[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  filteredCount: number;
  totalCount: number;
  filteredTotal: number;
  isFiltered: boolean;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all",        label: "All time" },
  { value: "today",      label: "Today" },
  { value: "week",       label: "This week" },
  { value: "month",      label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom",     label: "Custom…" },
];

const SORT_OPTIONS: { value: FilterState["sort"]; label: string }[] = [
  { value: "newest",  label: "Newest first" },
  { value: "oldest",  label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest",  label: "Lowest amount" },
];

// ── Drawer content (defined outside to avoid re-mounting) ──────────────────
interface DrawerContentProps {
  filters: FilterState;
  categories: Category[];
  onChange: (f: FilterState) => void;
  onDone: () => void;
  onReset: () => void;
  showSort: boolean;
}

function DrawerContent({ filters, categories, onChange, onDone, onReset, showSort }: DrawerContentProps) {
  const [catSearch, setCatSearch] = useState("");

  const visibleCats = catSearch.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : categories;

  const toggleCategory = (id: number) => {
    const ids = filters.categoryIds.includes(id)
      ? filters.categoryIds.filter((c) => c !== id)
      : [...filters.categoryIds, id];
    onChange({ ...filters, categoryIds: ids });
  };

  return (
    <div className="space-y-5">

      {/* Sort — mobile only */}
      {showSort && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-2">Sort by</p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange({ ...filters, sort: value })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filters.sort === value
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date range */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-2">Date range</p>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, datePreset: value })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filters.datePreset === value
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {filters.datePreset === "custom" && (
          <div className="mt-3 flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-white/40 block mb-1">From</label>
              <input
                type="date"
                value={filters.customFrom ?? ""}
                onChange={(e) => onChange({ ...filters, customFrom: e.target.value || null })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-white/40 block mb-1">To</label>
              <input
                type="date"
                value={filters.customTo ?? ""}
                onChange={(e) => onChange({ ...filters, customTo: e.target.value || null })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Amount range */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-2">Amount range</p>
        <div className="flex items-center gap-3">
          <input
            type="number" min="0" placeholder="₹ Min"
            value={filters.amountMin}
            onChange={(e) => onChange({ ...filters, amountMin: e.target.value })}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
          <span className="text-white/30 text-sm shrink-0">–</span>
          <input
            type="number" min="0" placeholder="₹ Max"
            value={filters.amountMax}
            onChange={(e) => onChange({ ...filters, amountMax: e.target.value })}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-2">Categories</p>
          {categories.length > 6 && (
            <div className="relative mb-2">
              <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-white/30" style={{ fontSize: 15 }}>search</span>
              <input
                type="text" placeholder="Search categories…"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
            {visibleCats.map((cat) => {
              const active = filters.categoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all text-left truncate ${
                    active ? "border-transparent" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  style={active ? { backgroundColor: cat.color + "22", color: cat.color, borderColor: cat.color + "55" } : {}}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/8">
        <button onClick={onReset} className="text-xs text-white/35 hover:text-white/60 transition-colors">
          Clear all filters
        </button>
        <button
          onClick={onDone}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ExpenseFilters({
  categories, filters, onChange,
}: ExpenseFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) onChange({ ...filters, search: searchInput });
    }, 150);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close desktop drawer on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    }
    if (drawerOpen) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [drawerOpen]);

  const reset = () => {
    setSearchInput("");
    onChange(DEFAULT_FILTERS);
    setDrawerOpen(false);
  };

  // Count of active non-search filters (for badge on button)
  const activeFilterCount =
    (filters.categoryIds.length > 0 ? 1 : 0) +
    (filters.datePreset !== "all" ? 1 : 0) +
    (filters.amountMin !== "" || filters.amountMax !== "" ? 1 : 0) +
    (filters.sort !== "newest" ? 1 : 0);

  // Active badge data
  const activeBadges: { key: string; label: string; icon?: string; color?: string; onRemove: () => void }[] = [];

  if (filters.datePreset !== "all") {
    const label = DATE_PRESETS.find((p) => p.value === filters.datePreset)?.label ?? filters.datePreset;
    activeBadges.push({
      key: "date", label, icon: "calendar_month",
      onRemove: () => onChange({ ...filters, datePreset: "all", customFrom: null, customTo: null }),
    });
  }
  filters.categoryIds.forEach((id) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) activeBadges.push({
      key: `cat-${id}`, label: cat.name, color: cat.color,
      onRemove: () => onChange({ ...filters, categoryIds: filters.categoryIds.filter((c) => c !== id) }),
    });
  });
  if (filters.amountMin !== "" || filters.amountMax !== "") {
    const label =
      filters.amountMin && filters.amountMax ? `₹${filters.amountMin}–₹${filters.amountMax}` :
      filters.amountMin ? `≥ ₹${filters.amountMin}` :
      `≤ ₹${filters.amountMax}`;
    activeBadges.push({
      key: "amount", label, icon: "currency_rupee",
      onRemove: () => onChange({ ...filters, amountMin: "", amountMax: "" }),
    });
  }
  if (filters.sort !== "newest") {
    const label = SORT_OPTIONS.find((s) => s.value === filters.sort)?.label ?? filters.sort;
    activeBadges.push({
      key: "sort", label, icon: "swap_vert",
      onRemove: () => onChange({ ...filters, sort: "newest" }),
    });
  }

  const drawerProps: DrawerContentProps = {
    filters, categories, onChange, onDone: () => setDrawerOpen(false), onReset: reset, showSort: false,
  };

  return (
    <div ref={wrapperRef} className="relative">

      {/* ── Bar ── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-2.5">

        {/* Row 1: search + filters button + sort (desktop) */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-white/30" style={{ fontSize: 18 }}>search</span>
            <input
              type="text" placeholder="Search expenses…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all shrink-0 ${
              drawerOpen || activeFilterCount > 0
                ? "bg-indigo-500/15 border-indigo-500/35 text-indigo-300"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
            }`}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>tune</span>
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort — desktop only */}
          <div className="hidden md:block relative shrink-0">
            <span className="material-symbols-rounded pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35" style={{ fontSize: 16 }}>swap_vert</span>
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as FilterState["sort"] })}
              className="appearance-none pl-8 pr-7 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value} className="bg-[#0f0f2e]">{label}</option>
              ))}
            </select>
            <span className="material-symbols-rounded pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-white/35" style={{ fontSize: 16 }}>expand_more</span>
          </div>
        </div>

        {/* Row 2: active badges (horizontal scroll on mobile) */}
        {activeBadges.length > 0 && (
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[11px] text-white/25 shrink-0">Active:</span>
            {activeBadges.map((badge) => (
              <button
                key={badge.key}
                onClick={badge.onRemove}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 transition-all hover:opacity-75 group"
                style={
                  badge.color
                    ? { backgroundColor: badge.color + "20", color: badge.color, borderColor: badge.color + "50" }
                    : { backgroundColor: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderColor: "rgba(99,102,241,0.35)" }
                }
              >
                {badge.color
                  ? <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: badge.color }} />
                  : <span className="material-symbols-rounded" style={{ fontSize: 12 }}>{badge.icon}</span>
                }
                {badge.label}
                <span className="opacity-50 group-hover:opacity-100 ml-0.5 text-sm leading-none">×</span>
              </button>
            ))}
            {activeBadges.length > 1 && (
              <button onClick={reset} className="text-[11px] text-white/25 hover:text-white/50 shrink-0 transition-colors px-1">
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Desktop inline drawer ── */}
      {drawerOpen && (
        <div className="hidden md:block mt-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <DrawerContent {...drawerProps} showSort={false} />
        </div>
      )}

      {/* ── Mobile bottom sheet ── */}
      {drawerOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#13132b] border-t border-indigo-500/20 rounded-t-2xl px-5 pt-4 pb-10 max-h-[75vh] overflow-y-auto">
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white">Filters</span>
            </div>
            <DrawerContent {...drawerProps} showSort={true} />
          </div>
        </>
      )}
    </div>
  );
}
