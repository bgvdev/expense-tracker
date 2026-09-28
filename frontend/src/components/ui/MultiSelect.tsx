"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import Icon from "./Icon";
import Chip from "./Chip";
import { controlClasses, controlSizes } from "./Input";
import { shouldDropUp, type SelectOption } from "./Select";

interface MultiSelectProps {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  /** Shown when nothing is selected, e.g. "All categories". */
  placeholder?: string;
  searchPlaceholder?: string;
  /** Plural noun for the "3 categories" summary. */
  noun?: string;
  /** Render the selection as removable chips under the trigger. */
  showChips?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * Searchable multi-select dropdown. The list stays open while options are
 * toggled; Escape, Tab or an outside click closes it.
 */
export default function MultiSelect({
  id,
  values,
  onChange,
  options,
  placeholder = "Any",
  searchPlaceholder = "Search…",
  noun = "selected",
  showChips = true,
  disabled = false,
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);
  const listRef    = useRef<HTMLUListElement>(null);

  const selectedSet = useMemo(() => new Set(values), [values]);
  // Keep the caller's option order for the summary and chips.
  const selected = useMemo(() => options.filter((o) => selectedSet.has(o.value)), [options, selectedSet]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    if (rootRef.current) setDropUp(shouldDropUp(rootRef.current, 340));
    searchRef.current?.focus();
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, active, query]);

  function openList() {
    if (disabled) return;
    setQuery("");
    setActive(0);
    setOpen(true);
  }

  function close(refocus = true) {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  }

  function toggle(value: string) {
    onChange(selectedSet.has(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        e.stopPropagation(); // don't close the enclosing panel too
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
      case "Enter":
        e.preventDefault();
        if (filtered[active]) toggle(filtered[active].value);
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  const listboxId = id ? `${id}-listbox` : undefined;

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.map((o) => o.label).join(", ")
        : `${selected.length} ${noun}`;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
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
          className={cn(controlClasses, controlSizes.md, "flex items-center gap-2 pr-16 text-left")}
        >
          {selected.length > 0 && selected.length <= 2 && selected.some((o) => o.color) && (
            <span className="flex shrink-0 -space-x-1">
              {selected.map((o) => o.color && (
                <span key={o.value} className="h-2.5 w-2.5 rounded-full ring-2 ring-surface" style={{ backgroundColor: o.color }} />
              ))}
            </span>
          )}
          <span className={cn("truncate", selected.length === 0 && "text-faint")}>{summary}</span>
        </button>

        <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {selected.length > 0 && (
            <button
              type="button"
              aria-label="Clear selection"
              title="Clear selection"
              onClick={() => { onChange([]); triggerRef.current?.focus(); }}
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded text-faint hover:bg-subtle hover:text-foreground"
            >
              <Icon name="close" size={16} />
            </button>
          )}
          <Icon name="expand_more" size={18} className={cn("text-faint transition-transform", open && "rotate-180")} />
        </div>
      </div>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg animate-fade-in",
            dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          <div className="relative border-b border-border">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listboxId}
              aria-activedescendant={id && filtered.length ? `${id}-opt-${active}` : undefined}
              className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-faint focus:outline-none"
            />
          </div>

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto overscroll-contain p-1"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-muted">{options.length === 0 ? "No options" : "No matches"}</li>
            )}
            {filtered.map((opt, i) => {
              const isSelected = selectedSet.has(opt.value);
              return (
                <li
                  key={opt.value}
                  id={id ? `${id}-opt-${i}` : undefined}
                  role="option"
                  aria-selected={isSelected}
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  // Keep focus in the search box while clicking rows.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground",
                    i === active && "bg-subtle",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected ? "border-foreground bg-foreground text-background" : "border-border bg-surface",
                    )}
                  >
                    {isSelected && <Icon name="check" size={13} />}
                  </span>
                  {opt.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: opt.color }} />}
                  {opt.icon && <Icon name={opt.icon} size={16} className="text-faint" />}
                  <span className="truncate">{opt.label}</span>
                </li>
              );
            })}
          </ul>

          {values.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted">
              <span>{values.length} selected</span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange([])}
                className="font-medium text-foreground hover:underline underline-offset-4"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {showChips && selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((o) => (
            <Chip
              key={o.value}
              removable
              color={o.color ?? undefined}
              onClick={() => toggle(o.value)}
              aria-label={`Remove ${o.label}`}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
