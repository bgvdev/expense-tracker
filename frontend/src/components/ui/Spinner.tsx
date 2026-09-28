import { cn } from "@/lib/cn";

export default function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70",
        className,
      )}
    />
  );
}

/** Centered spinner with a label, for whole-page or whole-panel loading. */
export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-16 text-sm text-muted", className)}>
      <Spinner />
      {label}
    </div>
  );
}
