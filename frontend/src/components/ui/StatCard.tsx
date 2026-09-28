import { cn } from "@/lib/cn";
import Icon from "./Icon";
import Skeleton from "./Skeleton";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: string;
  /** Secondary line under the value. */
  hint?: React.ReactNode;
  loading?: boolean;
  highlight?: boolean;
}

export default function StatCard({ label, value, icon, hint, loading, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border bg-surface p-4",
        highlight ? "border-accent/40 ring-1 ring-accent/20" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-muted">
        <p className="truncate text-xs font-medium">{label}</p>
        {icon && <Icon name={icon} size={18} className={highlight ? "text-accent" : "text-faint"} />}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p className="mt-1.5 truncate text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
          {value}
        </p>
      )}
      {hint && !loading && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}
