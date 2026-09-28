import { cn } from "@/lib/cn";
import Icon from "./Icon";

const sizes = {
  sm: { box: "h-6 w-6 rounded-md", icon: 14 },
  md: { box: "h-9 w-9 rounded-lg", icon: 18 },
  lg: { box: "h-10 w-10 rounded-lg", icon: 20 },
} as const;

/** A category's icon on a soft tint of its color. */
export default function CategoryIcon({ icon, color, size = "md", className }: { icon: string; color: string; size?: keyof typeof sizes; className?: string }) {
  const s = sizes[size];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", s.box, className)}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <Icon name={icon} size={s.icon} />
    </span>
  );
}
