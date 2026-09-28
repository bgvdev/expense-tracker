import type { Config } from "tailwindcss";

/** Every color is a theme token defined as RGB channels in globals.css. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        surface:    token("surface"),
        subtle:     token("subtle"),
        border:     token("border"),
        foreground: token("foreground"),
        muted:      token("muted"),
        faint:      token("faint"),
        primary: {
          DEFAULT:    token("primary"),
          foreground: token("primary-foreground"),
        },
        accent:  token("accent"),
        danger:  token("danger"),
        success: token("success"),
        warning: token("warning"),
      },
      borderColor: {
        DEFAULT: token("border"),
      },
      ringColor: {
        DEFAULT: token("ring"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        "slide-in": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "panel-in": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-in": "slide-in 150ms ease-out",
        "fade-in":  "fade-in 150ms ease-out",
        "sheet-up": "sheet-up 200ms ease-out",
        "panel-in": "panel-in 220ms cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
