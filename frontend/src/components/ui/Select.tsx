"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import Icon from "./Icon";
import { controlClasses, controlSizes } from "./Input";

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
  size?: "sm" | "md";
  /** Accessible name when there is no visible <label>. */
  "aria-label"?: string;
}

/**
 * Whether a dropdown anchored to `el` should open upwards. Measures against
 * the nearest `[data-scroll-boundary]` (e.g. the side panel body, whose
 * footer would otherwise cover the list), falling back to the viewport.
 */
export function shouldDropUp(el: HTMLElement, needed = 300): boolean {
  const rect = el.getBoundingClientRect();
  const boundary = el.closest("[data-scroll-boundary]")?.getBoundingClientRect();
  const top = boundary?.top ?? 0;
  const bottom = boundary?.bottom ?? window.innerHeight;
  const below = bottom - rect.bottom;
  const above = rect.top - top;
  return below < needed && above > below;
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
  size = "md",
  "aria-label": ariaLabel,
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
    if (rootRef.current) setDropUp(shouldDropUp(rootRef.current));
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
        e.stopPropagation(); // don't let an enclosing panel close too
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
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          controlClasses,
          controlSizes[size],
          "flex items-center gap-2 pr-9 text-left",
        )}
      >
        {(selected?.icon || fallbackIcon) && (
          <Icon
            name={(selected?.icon || fallbackIcon)!}
            size={size === "sm" ? 15 : 18}
            className={selected?.color ? undefined : "text-faint"}
            style={selected?.color ? { color: selected.color } : undefined}
          />
        )}
        <span className={cn("truncate", !selected && "text-faint")}>
          {selected?.label ?? placeholder}
        </span>
        <Icon
          name="expand_more"
          size={18}
          className={cn(
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 min-w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg animate-fade-in",
            dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {showSearch && (
            <div className="relative border-b border-border">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-controls={listboxId}
                aria-activedescendant={id && filtered.length ? `${id}-opt-${active}` : undefined}
                className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-faint focus:outline-none"
              />
            </div>
          )}

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto overscroll-contain p-1"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-muted">
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
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                    i === active && "bg-subtle",
                    isSelected ? "font-medium text-foreground" : "text-foreground/80",
                    size === "sm" && "py-1.5 text-xs",
                  )}
                >
                  {opt.icon && (
                    <Icon name={opt.icon} size={18} style={{ color: opt.color ?? undefined }} />
                  )}
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Icon name="check" size={16} className="ml-auto text-foreground" />
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
