"use client";

import { useTheme, type Palette, type ThemePreference } from "@/hooks/useTheme";
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

/**
 * Preview swatches for each palette (primary, accent). These are literal colors
 * on purpose: the semantic tokens only describe the *active* palette, so they
 * cannot preview the others.
 */
const PALETTE_OPTIONS: { value: Palette; label: string; swatch: [string, string] }[] = [
  { value: "classic", label: "Classic", swatch: ["#18181b", "#4f46e5"] },
  { value: "ocean",   label: "Ocean",   swatch: ["#2563eb", "#0284c7"] },
  { value: "forest",  label: "Forest",  swatch: ["#047857", "#0d9488"] },
  { value: "sunset",  label: "Sunset",  swatch: ["#c2410c", "#e11d48"] },
];

/** Row of color swatches that picks the app's color palette. */
export function PaletteSwitcher({ className }: { className?: string }) {
  const { palette, setPalette } = useTheme();
  return (
    <div role="radiogroup" aria-label="Color palette" className={cn("flex flex-wrap gap-2", className)}>
      {PALETTE_OPTIONS.map((o) => {
        const active = palette === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPalette(o.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-2.5 h-9 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            <span className="flex -space-x-1.5">
              <span className="h-4 w-4 rounded-full ring-2 ring-surface" style={{ backgroundColor: o.swatch[0] }} />
              <span className="h-4 w-4 rounded-full ring-2 ring-surface" style={{ backgroundColor: o.swatch[1] }} />
            </span>
            {o.label}
            {active && <Icon name="check" size={15} className="text-primary" />}
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
