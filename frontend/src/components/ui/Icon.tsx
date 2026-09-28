import { cn } from "@/lib/cn";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** A Material Symbols Rounded glyph. Decorative by default. */
export default function Icon({ name, size = 20, className, style }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-rounded shrink-0 select-none", className)}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  );
}
