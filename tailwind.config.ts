import type { Config } from "tailwindcss";

/**
 * AI CAPITAL TRACKER — DESIGN TOKENS
 * ---------------------------------------------------------------------------
 * System: "broadsheet meets finance terminal".
 *   - Neutrals are ink/graphite only.
 *   - Colour is reserved for SEMANTICS: safe (emerald), risk (red),
 *     caution (amber). No violet, no pink, no gradients, no glow.
 *   - Radii cap at 10px. Shadows are hairline-only. Borders do the work.
 *
 * Surfaces and text are wired to CSS variables (see src/app/globals.css) so a
 * single class works in both themes without a `dark:` twin:
 *   bg-canvas  bg-surface  bg-surface-2  bg-surface-3
 *   text-ink   text-ink-muted  text-ink-subtle  text-ink-faint
 *   border-rule  border-rule-strong
 *
 * Semantic scales (safe / risk / caution) are fixed values that hold up on both
 * the white reading canvas and the dark terminal chrome.
 */

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        /**
         * The fonts are self-hosted by next/font (src/app/layout.tsx) and exposed
         * as CSS variables with an automatic size-adjusted fallback — that removes
         * the render-blocking Google Fonts stylesheet and the font-swap shift.
         */
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },

      colors: {
        /* ── Surfaces (theme-aware, light by default) ──────────────────────── */
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--c-surface-3) / <alpha-value>)",

        /* ── Ink (theme-aware text ramp) ───────────────────────────────────── */
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--c-ink-muted) / <alpha-value>)",
        "ink-subtle": "rgb(var(--c-ink-subtle) / <alpha-value>)",
        "ink-faint": "rgb(var(--c-ink-faint) / <alpha-value>)",

        /* ── Hairlines ─────────────────────────────────────────────────────── */
        rule: "rgb(var(--c-rule) / <alpha-value>)",
        "rule-strong": "rgb(var(--c-rule-strong) / <alpha-value>)",

        /* ── Header (always-dark terminal chrome, src/components/Navbar) ──── */
        "header-ink": "rgb(var(--c-header-ink) / <alpha-value>)",
        "header-muted": "rgb(var(--c-header-muted) / <alpha-value>)",
        "header-rule": "rgb(var(--c-header-rule) / <alpha-value>)",

        /* ── Semantic: SAFE (emerald) ──────────────────────────────────────── */
        safe: {
          50: "#EAF7F1",
          100: "#D3EFE2",
          200: "#A7DFC5",
          300: "#6FC9A4",
          400: "#34AC80",
          500: "#0E9F6E",
          600: "#0B7F58",
          700: "#0A6648",
          900: "#06321F",
        },
        /* ── Semantic: RISK (red) ──────────────────────────────────────────── */
        risk: {
          50: "#FDF0EF",
          100: "#FBE0DE",
          200: "#F6C3BF",
          300: "#EE9C96",
          400: "#E0706A",
          500: "#D1433C",
          600: "#B7352F",
          700: "#94271F",
          900: "#4A1310",
        },
        /* ── Semantic: CAUTION (amber) ─────────────────────────────────────── */
        caution: {
          50: "#FEF8EA",
          100: "#FBEBC4",
          200: "#F6D88C",
          300: "#EFC050",
          400: "#D89B18",
          500: "#B57F0A",
          600: "#966A08",
          700: "#7A5506",
          900: "#3D2A02",
        },
      },

      /* Radii cap at 10px. Anything larger reads as consumer-app chrome. */
      borderRadius: {
        none: "0px",
        sm: "3px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "10px",
        "3xl": "10px",
      },

      /* Elevation — three levels, and only three. Borders still do the
         separating work; a shadow only says "this surface floats above that
         one". The values live in globals.css so they can differ per theme
         (a shadow on graphite is a darker halo, not a glow). */
      boxShadow: {
        none: "none",
        xs: "0 1px 2px 0 rgb(var(--c-shadow) / 0.05)",
        sm: "0 1px 3px 0 rgb(var(--c-shadow) / 0.06)",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
        card: "var(--elev-card)",
        raised: "var(--elev-raised)",
        float: "var(--elev-float)",
      },

      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },

      maxWidth: {
        reading: "68ch",
        measure: "76ch",
      },

      /* Section rhythm — also exposed as .section / .section-sm / .section-lg */
      spacing: {
        section: "4rem",
        "section-sm": "3rem",
        "section-lg": "6rem",
      },

      animation: {
        "spin-slow": "spin 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;