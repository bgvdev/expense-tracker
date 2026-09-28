import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import Icon from "./Icon";

/** Shared look for every text-like control: inputs, the Select trigger, date pickers. */
export const controlClasses = cn(
  "w-full rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-faint",
  "transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export const controlSizes = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-10 px-3",
  lg: "h-11 px-3.5",
} as const;

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: keyof typeof controlSizes;
  /** Material symbol shown inside the left edge. */
  icon?: string;
  /** Short text shown inside the left edge, e.g. a currency sign. */
  prefix?: string;
  invalid?: boolean;
  /** Content rendered inside the right edge, e.g. a toggle button. */
  trailing?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", icon, prefix, invalid, trailing, className, ...rest },
  ref,
) {
  const hasLeading = Boolean(icon || prefix);
  return (
    <div className="relative">
      {hasLeading && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint flex items-center">
          {icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} /> : <span className="text-sm">{prefix}</span>}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlClasses,
          controlSizes[size],
          hasLeading && (size === "sm" ? "pl-8" : "pl-9"),
          trailing ? "pr-10" : undefined,
          invalid && "border-danger focus:border-danger focus:ring-danger/20",
          className,
        )}
        {...rest}
      />
      {trailing && <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">{trailing}</div>}
    </div>
  );
});

export default Input;
