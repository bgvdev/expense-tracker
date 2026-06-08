"use client";

import { useState, useEffect } from "react";
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
  { value: "custom",     label: "Custom" },
];

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest first" },
  { value: "oldest",  label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest",  label: "Lowest amount" },
];

export default function ExpenseFilters({
  categories, filters, onChange, filteredCount, totalCount, filteredTotal, isFiltered
}: ExpenseFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput });
      }
    }, 150);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount =
    (filters.search !== "" ? 1 : 0) +
    (filters.categoryIds.length > 0 ? 1 : 0) +
    (filters.datePreset !== "all" ? 1 : 0) +
    (filters.sort !== "newest" ? 1 : 0);

  const toggleCategory = (id: number) => {
    const ids = filters.categoryIds.includes(id)
      ? filters.categoryIds.filter((c) => c !== id)
      : [...filters.categoryIds, id];
    onChange({ ...filters, categoryIds: ids });
  };

  const reset = () => {
    setSearchInput("");
    onChange(DEFAULT_FILTERS);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded text-indigo-400" style={{ fontSize: 20 }}>filter_list</span>
          <span className="text-sm font-semibold text-white/70">Filters & Sort</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isFiltered && (
            <span className="text-xs text-white/40">
              {filteredCount} of {totalCount} · ₹{filteredTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          {activeCount > 0 && (
            <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-white/30" style={{ fontSize: 18 }}>search</span>
          <input
            type="text"
            placeholder="Search description…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div>
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = filters.categoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active ? "border-transparent" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                    style={active ? { backgroundColor: cat.color + "33", color: cat.color, borderColor: cat.color + "66" } : {}}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{cat.icon}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date presets */}
        <div>
          <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Date range</p>
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

        {/* Sort */}
        <div>
          <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Sort by</p>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as FilterState["sort"] })}
            className="w-full sm:w-auto px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value} className="bg-[#0f0f2e]">{label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
