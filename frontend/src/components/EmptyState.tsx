"use client";

interface EmptyStateProps {
  type: "no-expenses" | "no-results" | "no-categories";
  onClearFilters?: () => void;
}

const CONFIG = {
  "no-expenses": {
    icon: "receipt_long",
    title: "No expenses yet",
    subtitle: "Use the form to add your first expense.",
    action: null,
  },
  "no-results": {
    icon: "search_off",
    title: "No results match your filters",
    subtitle: "Try adjusting or clearing your filters.",
    action: "Clear filters",
  },
  "no-categories": {
    icon: "category",
    title: "No custom categories yet",
    subtitle: "Create a category to organize your expenses.",
    action: null,
  },
};

export default function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  const { icon, title, subtitle, action } = CONFIG[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <span className="material-symbols-rounded text-white/30" style={{ fontSize: 32 }}>{icon}</span>
      </div>
      <p className="text-white/60 font-medium">{title}</p>
      <p className="text-white/30 text-sm mt-1">{subtitle}</p>
      {action && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all"
        >
          {action}
        </button>
      )}
    </div>
  );
}
