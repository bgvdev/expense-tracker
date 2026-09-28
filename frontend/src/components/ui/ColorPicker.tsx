"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { controlClasses, controlSizes } from "./Input";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

/** "#abc", "abc", "#aabbcc" or "aabbcc" → "#AABBCC"; anything else → null. */
function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return ("#" + raw.split("").map((c) => c + c).join("")).toUpperCase();
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return ("#" + raw).toUpperCase();
  return null;
}

/**
 * Free color choice: a swatch that opens the OS color picker, plus an
 * editable hex field. The API only accepts #RRGGBB, so values are always
 * normalized to that form before they leave this component.
 */
export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const id = useId();
  const [draft, setDraft] = useState(value.toUpperCase());

  // Follow external changes (e.g. the panel re-opening on another category).
  // Keep what is being typed when it already means the current color: "#636"
  // normalizes to #663366, and overwriting the field with that expansion
  // (maxLength 7) would leave no room to finish typing "#6366F1".
  useEffect(() => {
    setDraft((d) => (normalizeHex(d) === value.toUpperCase() ? d : value.toUpperCase()));
  }, [value]);

  const draftValid = normalizeHex(draft) !== null;

  function handleDraft(text: string) {
    setDraft(text);
    const hex = normalizeHex(text);
    if (hex) onChange(hex);
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={`${id}-native`}
        title="Pick a color"
        className={cn(
          "relative h-10 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-surface",
        )}
        style={{ backgroundColor: value }}
      >
        <span className="sr-only">Pick a color</span>
        {/* Invisible but clickable: the swatch above is what the user sees. */}
        <input
          id={`${id}-native`}
          type="color"
          value={value.toLowerCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      <div className="relative flex-1">
        <input
          type="text"
          aria-label="Hex color"
          aria-invalid={!draftValid || undefined}
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          value={draft}
          onChange={(e) => handleDraft(e.target.value)}
          // Snap an unfinished entry back to the last valid color.
          onBlur={() => setDraft(value.toUpperCase())}
          placeholder="#6366F1"
          className={cn(
            controlClasses,
            controlSizes.md,
            "font-mono uppercase tabular-nums",
            !draftValid && "border-danger focus:border-danger focus:ring-danger/20",
          )}
        />
      </div>
    </div>
  );
}
