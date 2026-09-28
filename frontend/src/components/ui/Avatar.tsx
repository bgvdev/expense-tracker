import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" } as const;

export default function Avatar({ name, size = "sm", className }: { name?: string | null; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-subtle font-semibold text-foreground border border-border",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
