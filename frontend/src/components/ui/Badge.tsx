import { cn } from "@/lib/cn";
import Icon from "./Icon";

type Tone = "neutral" | "accent" | "success" | "danger" | "warning";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-muted",
  accent:  "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  danger:  "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
};

interface BadgeProps {
  tone?: Tone;
  icon?: string;
  /** A category color; renders a colored dot and overrides the tone. */
  color?: string;
  className?: string;
  children: React.ReactNode;
}

export default function Badge({ tone = "neutral", icon, color, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        color ? "bg-subtle text-foreground/80" : tones[tone],
        className,
      )}
    >
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}
