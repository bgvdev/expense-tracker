"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Pinned to the bottom of the panel, e.g. Cancel / Save buttons. */
  footer?: React.ReactNode;
  width?: string;
}

/**
 * A drawer that slides in from the right edge, used for every add/edit form.
 * Full width on phones. Escape or a click on the scrim closes it, and page
 * scroll is locked while it is open.
 */
export default function SidePanel({ open, onClose, title, description, children, footer, width = "sm:max-w-md" }: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // A dropdown inside the panel marks its own Escape as handled. React's
    // listener sits on this same document node, so stopPropagation() can't
    // shield us — defaultPrevented is the signal.
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the panel unless something inside already took it.
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 animate-fade-in dark:bg-black/60"
        onMouseDown={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-panel-title"
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-surface shadow-2xl outline-none animate-panel-in",
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="side-panel-title" className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <IconButton icon="close" label="Close panel" size="sm" onClick={onClose} className="-mr-1.5" />
        </header>

        <div data-scroll-boundary className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-between gap-2 border-t border-border bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
