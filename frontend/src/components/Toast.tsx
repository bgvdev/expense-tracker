"use client";

import { useToast, Toast as ToastItem } from "@/hooks/useToast";

const typeStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    icon: "check_circle",
  },
  error: {
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: "error",
  },
  info: {
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/30",
    text: "text-indigo-300",
    icon: "info",
  },
};

function ToastMessage({ toast }: { toast: ToastItem }) {
  const { dismissToast } = useToast();
  const s = typeStyles[toast.type];

  return (
    <div
      className={`flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)] px-4 py-3 rounded-xl border ${s.bg} ${s.border} shadow-xl animate-slideIn`}
    >
      <span className={`material-symbols-rounded mt-0.5 shrink-0 ${s.text}`} style={{ fontSize: 20 }}>
        {s.icon}
      </span>
      <p className={`flex-1 text-sm font-medium ${s.text}`}>{toast.message}</p>
      <button
        onClick={() => dismissToast(toast.id)}
        className={`shrink-0 ${s.text} opacity-60 hover:opacity-100 transition-opacity`}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastMessage toast={t} />
        </div>
      ))}
    </div>
  );
}
