import { cn } from "@/lib/cn";

interface FieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  /** Muted helper text under the control. */
  hint?: React.ReactNode;
  /** Error text under the control; replaces the hint. */
  error?: React.ReactNode;
  optional?: boolean;
  /** Content aligned to the right of the label, e.g. a "Forgot password?" link. */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  hintId?: string;
}

/** Label + control + hint/error, stacked with consistent spacing. */
export default function Field({ label, htmlFor, hint, error, optional, action, className, children, hintId }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {optional && <span className="ml-1 font-normal text-faint">(optional)</span>}
        </label>
        {action}
      </div>
      {children}
      {(error || hint) && (
        <p id={hintId} aria-live="polite" className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
