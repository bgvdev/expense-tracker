"use client";

import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import Icon from "./Icon";
import Alert from "./Alert";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Runs the action. The dialog shows a spinner while it runs, closes when
   * it resolves, and stays open showing the error message if it throws.
   */
  onConfirm: () => Promise<unknown> | void;
  title: string;
  description?: React.ReactNode;
  /** Optional preview of what is being acted on, e.g. the expense row. */
  children?: React.ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
  icon?: string;
}

function errorMessage(err: unknown): string {
  const apiErr = err as { data?: { message?: string; errors?: Record<string, string[]> } };
  return (
    Object.values(apiErr?.data?.errors ?? {}).flat().join(" ") ||
    apiErr?.data?.message ||
    "Something went wrong. Please try again."
  );
}

/** Centered confirmation for destructive actions. */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  icon = "delete",
}: ConfirmDialogProps) {
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Fresh state each time it opens; focus the safe choice.
  useEffect(() => {
    if (!open) return;
    setBusy(false);
    setError(null);
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented && !busy) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onClose]);

  if (!open) return null;

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 p-4 animate-fade-in dark:bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? "confirm-description" : undefined}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl animate-slide-in"
      >
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
          <Icon name={icon} size={20} />
        </span>
        <h2 id="confirm-title" className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p id="confirm-description" className="mt-1 text-sm text-muted">{description}</p>
        )}

        {children && <div className="mt-4">{children}</div>}
        {error && <Alert className="mt-4">{error}</Alert>}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Compact summary row used as the ConfirmDialog preview. */
export function ConfirmPreview({ leading, title, subtitle, trailing }: { leading?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}
