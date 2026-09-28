"use client";

import { useTheme, type ThemePreference } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";
import Icon from "./Icon";
import { IconButton } from "./Button";

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "light",  label: "Light",  icon: "light_mode" },
  { value: "dark",   label: "Dark",   icon: "dark_mode" },
  { value: "system", label: "System", icon: "contrast" },
];

/** Three-way segmented control: light / dark / system. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex rounded-lg border border-border bg-subtle p-0.5", className)}>
      {OPTIONS.map((o) => {
        const active = preference === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(o.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 h-7 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            <Icon name={o.icon} size={15} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Single icon button that flips between light and dark. */
export default function ThemeToggle({ className }: { className?: string }) {
  const { resolved, setPreference } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <IconButton
      icon={resolved === "dark" ? "light_mode" : "dark_mode"}
      label={`Switch to ${next} theme`}
      onClick={() => setPreference(next)}
      className={className}
    />
  );
}
