"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
/** Color palette, independent of light/dark. Classic is the base tokens in globals.css. */
export type Palette = "classic" | "ocean" | "forest" | "sunset";

export const PALETTES: Palette[] = ["classic", "ocean", "forest", "sunset"];

export const THEME_STORAGE_KEY = "theme";
export const PALETTE_STORAGE_KEY = "palette";

/**
 * Runs inline in <head> before first paint, so the page never flashes the
 * wrong theme or palette. Must stay in sync with applyTheme()/applyPalette() below.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||((p!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);var c=localStorage.getItem("${PALETTE_STORAGE_KEY}");if(${JSON.stringify(PALETTES.filter((p) => p !== "classic"))}.indexOf(c)>-1)document.documentElement.setAttribute("data-palette",c);}catch(e){}})();`;

interface ThemeContextType {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
  palette: Palette;
  setPalette: (p: Palette) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function applyPalette(palette: Palette) {
  if (palette === "classic") document.documentElement.removeAttribute("data-palette");
  else document.documentElement.setAttribute("data-palette", palette);
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage blocked (private mode etc.) — fall back to the OS setting.
  }
  return "system";
}

function readPalette(): Palette {
  try {
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (PALETTES.includes(stored as Palette)) return stored as Palette;
  } catch {
    // Storage blocked — use the default palette.
  }
  return "classic";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [palette, setPaletteState] = useState<Palette>("classic");

  // Sync with what the inline script already applied.
  useEffect(() => {
    const p = readPreference();
    setPreferenceState(p);
    setResolved(p === "system" ? systemTheme() : p);
    setPaletteState(readPalette());
  }, []);

  // Follow OS changes while the preference is "system".
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const t = systemTheme();
      setResolved(t);
      applyTheme(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    try {
      if (p === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, p);
    } catch {
      // Non-persistent is fine; the choice still applies for this visit.
    }
    const t = p === "system" ? systemTheme() : p;
    setResolved(t);
    applyTheme(t);
  }, []);

  const setPalette = useCallback((p: Palette) => {
    setPaletteState(p);
    try {
      if (p === "classic") localStorage.removeItem(PALETTE_STORAGE_KEY);
      else localStorage.setItem(PALETTE_STORAGE_KEY, p);
    } catch {
      // Non-persistent is fine; the choice still applies for this visit.
    }
    applyPalette(p);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference, palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
