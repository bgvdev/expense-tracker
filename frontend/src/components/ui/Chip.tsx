import { cn } from "@/lib/cn";
import Icon from "./Icon";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: string;
  /** Category color dot. */
  color?: string;
  /** Show a trailing ×, for removable filter chips. */
  removable?: boolean;
}

/** Toggleable pill for presets and filters. */
export default function Chip({ selected, icon, color, removable, className, children, type = "button", ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={removable ? undefined : selected}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-muted hover:text-foreground hover:border-foreground/30",
        className,
      )}
      {...rest}
    >
      {color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      {icon && <Icon name={icon} size={14} />}
      <span className="truncate">{children}</span>
      {removable && <Icon name="close" size={14} className="-mr-1 opacity-60" />}
    </button>
  );
}
