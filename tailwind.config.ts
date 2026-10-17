import type { Config } from "tailwindcss";

/**
 * AI Capital Tracker — design tokens.
 *
 * Two surface families:
 *  - "ledger"  : light panels (white + hairline rules + mono micro-labels)
 *  - "terminal": dark instrument surfaces (zinc-950 + emerald phosphor glow)
 *
 * Only the accent + terminal scales are extended. The default `zinc`,
 * `emerald`, `sky`, `amber`, `rose`, `violet`, `indigo` and `blue` ramps are
 * intentionally left untouched so tone-named utilities stay predictable.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Research accent — emerald phosphor. Alias of `emerald` so the
           whole ramp exists (previous pass shipped 50/100/200 + 500..950
           only, which made `brand-300`/`brand-400` unresolvable). */
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        /* Terminal instrument surfaces. */
        terminal: {
          950: "#09090b",
          900: "#0f1014",
          850: "#15161b",
          800: "#1c1d24",
          700: "#2a2b34",
          edge: "rgba(255, 255, 255, 0.09)",
          "edge-strong": "rgba(255, 255, 255, 0.16)",
        },
      },
      borderRadius: {
        panel: "0.875rem",
        terminal: "1rem",
      },
      boxShadow: {
        /* Light ledger panel: hairline + very soft ambient depth. */
        panel:
          "0 1px 2px rgba(9, 9, 11, 0.04), 0 1px 3px rgba(9, 9, 11, 0.03), 0 14px 30px -20px rgba(9, 9, 11, 0.30)",
        /* Lift-on-hover end state. */
        lifted:
          "0 2px 4px rgba(9, 9, 11, 0.05), 0 20px 44px -20px rgba(9, 9, 11, 0.34)",
        /* Emerald phosphor. */
        glow: "0 0 0 1px rgba(52, 211, 153, 0.28), 0 10px 34px -10px rgba(52, 211, 153, 0.40)",
        "glow-soft": "0 10px 34px -18px rgba(16, 185, 129, 0.55)",
        /* 1px top highlight used on dark instrument panels. */
        "edge-light": "inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
      },
      fontSize: {
        /* The unified micro-label used by eyebrows, table heads and pills. */
        label: ["0.625rem", { lineHeight: "1rem", letterSpacing: "0.09em" }],
        micro: ["0.6875rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        label: "0.09em",
        caps: "0.14em",
      },
      transitionTimingFunction: {
        terminal: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        /* Softer, slower live-feed ring than Tailwind's `animate-ping`
           (which is far too loud once repeated in a 20-row ledger). */
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "70%": { transform: "scale(2.4)", opacity: "0" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0, 0, 0.2, 1) infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "JetBrains", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;