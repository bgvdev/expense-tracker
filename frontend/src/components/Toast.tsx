"use client";

import { useToast, Toast as ToastItem } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import Icon from "@/components/ui/Icon";

const typeStyles: Record<ToastItem["type"], { icon: string; tone: string }> = {
  success: { icon: "check_circle", tone: "text-success" },
  error:   { icon: "error",        tone: "text-danger" },
  info:    { icon: "info",         tone: "text-accent" },
};

function ToastMessage({ toast }: { toast: ToastItem }) {
  const { dismissToast } = useToast();
  const s = typeStyles[toast.type];

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className="flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 shadow-lg animate-slide-in"
    >
      <Icon name={s.icon} size={18} className={cn("mt-px", s.tone)} />
      <p className="flex-1 text-sm text-foreground">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss"
        className="text-faint transition-colors hover:text-foreground"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastMessage toast={t} />
        </div>
      ))}
    </div>
  );
}
