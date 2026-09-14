"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: string | null;
  color?: string | null;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  /** Material symbol shown on the left when the selected option has no icon of its own. */
  fallbackIcon?: string;
  /** Show the filter box. Defaults to on once the list is long enough to scroll. */
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
}

/** Lists longer than this get a filter box unless `searchable` says otherwise. */
const SEARCH_THRESHOLD = 8;

/**
 * Styled single-select listbox with an optional filter box.
 *
 * A native <select> renders its popup through the OS, so its height cannot be
 * capped in CSS — with many categories the list ran off-screen. This renders
 * the list itself, so it gets a fixed max-height, its own scrollbar, and a
 * search field for jumping straight to an option.
 */
export default function Select({
  id,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select…",
  fallbackIcon,
  searchable,
  searchPlaceholder = "Search…",
  className = "",
}: Props) {
  const [open, setOpen]     = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery]   = useState("");
  const [dropUp, setDropUp] = useState(false);
  const rootRef             = useRef<HTMLDivElement>(null);
  const listRef             = useRef<HTMLUListElement>(null);
  const searchRef           = useRef<HTMLInputElement>(null);
  const triggerRef          = useRef<HTMLButtonElement>(null);

  const showSearch = searchable ?? options.length >= SEARCH_THRESHOLD;
  const selected   = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Flip upwards when there is not enough room below, and focus the filter box.
  useLayoutEffect(() => {
    if (!open) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < 300 && rect.top > below);
    }
    searchRef.current?.focus();
  }, [open]);

  // Keep the highlighted row in view as it moves.
  useLayoutEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, active, query]);

  function openList() {
    if (disabled) return;
    setQuery("");
    setActive(Math.max(options.findIndex((o) => o.value === value), 0));
    setOpen(true);
  }

  function close(refocus = true) {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  }

  function commit(idx: number) {
    const opt = filtered[idx];
    if (!opt) return;
    onChange(opt.value);
    close();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        e.stopPropagation(); // don't let an enclosing modal close too
        close();
        break;
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (!showSearch) { e.preventDefault(); setActive(0); }
        break;
      case "End":
        if (!showSearch) { e.preventDefault(); setActive(filtered.length - 1); }
        break;
      case "Enter":
        e.preventDefault();
        commit(active);
        break;
      case " ":
        // Space types into the filter box; only a bare listbox selects with it.
        if (!showSearch) { e.preventDefault(); commit(active); }
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  const listboxId = id ? `${id}-listbox` : undefined;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className="w-full flex items-center gap-3 pl-4 pr-10 py-3 rounded-xl text-left
                   bg-white/5 border border-white/10 text-white
                   focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {(selected?.icon || fallbackIcon) && (
          <span
            className="material-symbols-rounded shrink-0"
            style={{ fontSize: 18, color: selected?.color ?? "rgba(255,255,255,0.3)" }}
          >
            {selected?.icon || fallbackIcon}
          </span>
        )}
        <span className={`truncate ${selected ? "" : "text-white/40"}`}>
          {selected?.label ?? placeholder}
        </span>
        <span
          className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          style={{ fontSize: 20 }}
        >
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div
          className={`absolute z-50 w-full rounded-xl border border-white/10 bg-[#141435]
                      shadow-2xl shadow-black/50 overflow-hidden
                      ${dropUp ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {showSearch && (
            <div className="relative border-b border-white/10">
              <span
                className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
                style={{ fontSize: 18 }}
              >
                search
              </span>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-controls={listboxId}
                aria-activedescendant={id && filtered.length ? `${id}-opt-${active}` : undefined}
                className="w-full pl-10 pr-3 py-2.5 bg-transparent text-sm text-white
                           placeholder-white/30 focus:outline-none"
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-white/40">
                {options.length === 0 ? "No options" : "No matches"}
              </li>
            )}
            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  id={id ? `${id}-opt-${i}` : undefined}
                  role="option"
                  aria-selected={isSelected}
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(i)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm
                              ${i === active ? "bg-indigo-500/20" : ""}
                              ${isSelected ? "text-white font-semibold" : "text-white/80"}`}
                >
                  {opt.icon && (
                    <span
                      className="material-symbols-rounded shrink-0"
                      style={{ fontSize: 18, color: opt.color ?? undefined }}
                    >
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-rounded ml-auto text-indigo-400 shrink-0" style={{ fontSize: 18 }}>
                      check
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
