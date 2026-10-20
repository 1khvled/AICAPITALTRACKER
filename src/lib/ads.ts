/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADSTERRA INFRASTRUCTURE — configuration + placement registry
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW TO TURN ADS ON (one step, no code changes)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. In the Adsterra dashboard, create a zone for the format you want
 *    (banner 728x90, mobile 320x50, billboard 970x250, rectangle 300x250,
 *    native banner, social bar).
 * 2. Copy that zone's invocation script URL and paste it into `.env.local`
 *    (and `.env.example` for the record) using this key shape:
 *
 *      NEXT_PUBLIC_ADSTERRA_<PLACEMENT>
 *
 *    where <PLACEMENT> is the placement id, uppercased with dashes turned into
 *    underscores. Examples:
 *
 *      NEXT_PUBLIC_ADSTERRA_HOME_LEADERBOARD=https://<zone-script>.js
 *      NEXT_PUBLIC_ADSTERRA_HOME_INFEED_1=https://<zone-script>.js
 *      NEXT_PUBLIC_ADSTERRA_LEDGER_TOP=https://<zone-script>.js
 *      NEXT_PUBLIC_ADSTERRA_GLOBAL_FOOTER_BILLBOARD=https://<zone-script>.js
 *
 *    Until a value is present, `<AdSlot placementId="home-leaderboard" />`
 *    renders NOTHING — no box, no layout shift, no console noise.
 *
 * 3. THE TWO ZONE SHAPES (auto-detected from the URL — paste either one)
 * ─────────────────────────────────────────────────────────────────────────
 *    Adsterra serves every zone invocation from one host, and the shape of the
 *    snippet differs by the path segment. `detectAdZoneShape()` below switches
 *    on that segment so a pasted zone "just works" with no extra config:
 *
 *    (a) NATIVE BANNER — `/21/<zoneKey>`
 *        Adsterra's snippet is:
 *            <div id="container-<zoneKey>"></div>
 *            <script async data-cfasync="false" src="https://<host>/21/<zoneKey>">
 *              </script>
 *        The script looks the container up by id and renders INTO it, so the
 *        div must exist first. We render the div server-side (it is in the SSR
 *        HTML before any script runs) and load the invocation script after
 *        hydration. The container id is taken from the optional `_ID` override;
 *        if that is missing we derive Adsterra's own default, `container-<zoneKey>`,
 *        and only then fall back to `ad-<placementId>`.
 *
 *    (b) CLASSIC BANNER (leaderboard / billboard / 160x600) — `/22/<zoneKey>`
 *        Adsterra's snippet is:
 *            <script>atOptions = { key: '<zoneKey>', format: 'iframe',
 *                                 height: 600, width: 160, params: {} };</script>
 *            <script async data-cfasync="false" src="https://<host>/22/<zoneKey>">
 *              </script>
 *        The invocation script calls `document.write('<iframe …>')`, which
 *        would WIPE a React-owned document if it ever ran in the page. So this
 *        shape is never loaded with next/script: AdSlot renders a nested
 *        <iframe srcDoc="…"> that carries the atOptions script plus the
 *        invocation script. document.write then lands inside the throwaway
 *        child document instead of the host page. See `buildAtOptionsDoc()`.
 *
 *    Both shapes are pinned to exact pixel geometry, so neither moves the page.
 *
 * 4. OPTIONAL per-placement knobs
 * ─────────────────────────────────────────────────────────────────────────
 *    Container id override — used when a zone expects an id other than ours:
 *
 *      NEXT_PUBLIC_ADSTERRA_HOME_LEADERBOARD_ID=my-zone-container-id
 *
 *    Size override — only needed for a `/22/` zone whose unit is not the
 *    format's default (format defaults: banner160 160x600, banner 728x90,
 *    mobile 320x50, billboard 970x250, mpu 300x250):
 *
 *      NEXT_PUBLIC_ADSTERRA_MARKETS_SIDEBAR_MPU_SIZE=160x600
 *
 * OFF SWITCHES
 * ─────────────────────────────────────────────────────────────────────────
 *   NEXT_PUBLIC_ADSTERRA_DISABLED=1           kill every slot on the site
 *   NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_ENABLED=1 required to load the social bar
 *                                             (that placement is default-off)
 *
 * NON-INTRUSIVE POLICY (hard-coded, not configurable)
 * ─────────────────────────────────────────────────────────────────────────
 *   Only two zone shapes are accepted: `/21/` native banners and `/22/`
 *   display banners. A pasted URL that does not match either shape is treated
 *   as "not configured" and renders nothing, so a popunder, direct-link or
 *   interstitial snippet can never be dropped onto the page by accident. The
 *   `/22/` isolation iframe is sandboxed without `allow-top-navigation`, so a
 *   creative can open its own tab on a click but can never redirect the reader
 *   away from the page. The social bar stays default-off because it floats
 *   over content; nothing is fixed, sticky or overlaid by default.
 *
 *   Density rule of thumb (Adsterra's own publisher guidance): at most two
 *   native blocks per page, and preferably 2-3 units total. The registry
 *   exposes up to five slots on the long money pages and four elsewhere —
 *   page, not registry, decides what is actually configured. Every slot is
 *   below the primary answer or between sections, never above the headline,
 *   never over a control. Below the fold, the `/21/` native scripts wait for
 *   the viewport (see AdScript) so phones load only the units being read; the
 *   `/22/` display creatives are deferred by the browser's own lazy-iframe
 *   loading (they are not gated by AdScript - an isolation iframe cannot be
 *   injected by a script the way a native unit can).
 *
 * WHY NEXT_PUBLIC_
 * ─────────────────────────────────────────────────────────────────────────
 * The Adsterra loader is a third-party browser script, so it can only run
 * client-side. `NEXT_PUBLIC_*` values are inlined into BOTH the server render
 * and the client bundle, which keeps server and browser in agreement about
 * whether a slot exists (clean hydration). Every read below is therefore a
 * literal `process.env.NEXT_PUBLIC_...` — a computed `process.env[key]` lookup
 * is NOT inlined by Next.js and would be undefined in the browser.
 *
 * This file reads env strings only. It touches no data, model or API code.
 */

/* ── Formats ────────────────────────────────────────────────────────────── */

export type AdFormatId =
  | "banner"
  | "mobile"
  | "billboard"
  | "mpu"
  | "banner160"
  | "native"
  | "social-bar";

export interface AdFormat {
  /** Stable format id. Also the reserved-height class suffix: `.ad-slot--<id>`. */
  id: AdFormatId;
  /** Plain-language description for humans reading the config. */
  label: string;
  /** Creative size the zone should be created at. */
  unit: string;
  /** True when the same zone script serves more than one breakpoint. */
  responsive: boolean;
  /** Intrinsic creative width in px. Only set for fixed-size units. */
  width?: number;
  /** Intrinsic creative height in px. Only set for fixed-size units. */
  height?: number;
}

export const AD_FORMATS: Record<AdFormatId, AdFormat> = {
  /**
   * Adsterra's classic banners are FIXED-SIZE creatives: the unit's geometry
   * comes from the snippet itself (`atOptions.width/height`), not from the
   * page. A `/22/` zone therefore has to be pinned to the unit's real size or
   * the creative is squeezed into the wrong box.
   *
   * `responsive` therefore means "this format has a phone-sized collapse" —
   * the banner format collapses to the 320x50 mobile unit below 768px (or to
   * a configured phone twin), not "the creative resizes itself".
   */
  banner: {
    id: "banner",
    label: "Leaderboard banner",
    unit: "728x90",
    responsive: true,
    width: 728,
    height: 90,
  },
  mobile: {
    id: "mobile",
    label: "Mobile banner",
    unit: "320x50",
    responsive: true,
    width: 320,
    height: 50,
  },
  billboard: {
    id: "billboard",
    label: "Billboard",
    unit: "970x250",
    responsive: true,
    width: 970,
    height: 250,
  },
  mpu: {
    id: "mpu",
    label: "Medium rectangle",
    unit: "300x250",
    responsive: true,
    width: 300,
    height: 250,
  },
  /* 160x600 skyscraper. Fixed unit, so the geometry is pinned exactly — it is
     the fallback creative for the `/22/` atOptions shape (see detectAdZoneShape). */
  banner160: {
    id: "banner160",
    label: "Skyscraper banner",
    unit: "160x600",
    responsive: false,
    width: 160,
    height: 600,
  },
  native: { id: "native", label: "Native banner", unit: "fluid", responsive: true },
  "social-bar": { id: "social-bar", label: "Social bar", unit: "full width x 50", responsive: true },
};

/**
 * Intrinsic geometry for a format id, or null when the format is fluid
 * (native banners size themselves). Used to size the atOptions isolation iframe.
 */
export function adFormatSize(
  formatId: AdFormatId
): { width: number; height: number } | null {
  const fmt = AD_FORMATS[formatId];
  if (fmt && typeof fmt.width === "number" && typeof fmt.height === "number") {
    return { width: fmt.width, height: fmt.height };
  }
  return null;
}

/* ── Placements ─────────────────────────────────────────────────────────── */

export type PlacementId =
  /* home */
  | "home-leaderboard"
  | "home-infeed-1"
  | "home-infeed-2"
  | "home-mid"
  | "home-footer"
  /* ledger */
  | "ledger-top"
  | "ledger-infeed"
  | "ledger-mid"
  | "ledger-bottom"
  /* companies */
  | "companies-top"
  | "companies-infeed"
  | "companies-mid"
  | "companies-bottom"
  /* markets */
  | "markets-top"
  | "markets-sidebar-mpu"
  | "markets-infeed"
  | "markets-bottom"
  /* news */
  | "news-top"
  | "news-infeed"
  | "news-bottom"
  /* methodology */
  | "methodology-top"
  | "methodology-infeed"
  | "methodology-bottom"
  /* 2000 vs 2026 comparison */
  | "dotcom-top"
  | "dotcom-infeed"
  | "dotcom-bottom"
  /* charts */
  | "visualize-top"
  | "visualize-infeed"
  | "visualize-bottom"
  /* simulator */
  | "sandbox-top"
  | "sandbox-infeed"
  | "sandbox-bottom"
  /* developer api */
  | "api-docs-top"
  | "api-docs-bottom"
  /* site-wide */
  | "global-leaderboard"
  | "global-infeed"
  | "global-footer-billboard"
  /* social bar */
  | "social-bar";

export interface AdPlacement {
  /** Stable id. Pages pass this to `<AdSlot placementId="..." />`. */
  placementId: PlacementId;
  /** Allowed format ids for this slot, in preference order. */
  formats: readonly AdFormatId[];
  /** Format used when the zone script does not declare a size of its own. */
  fallbackFormat: AdFormatId;
  /** Accessible label for the slot wrapper. */
  label: string;
  /** Above-the-fold slots load after hydration; the rest wait for idle. */
  eager?: boolean;
  /** Never loads unless explicitly opted in (social bar). */
  defaultOff?: boolean;
}

/**
 * Every placement on the site. AdSlot only ever looks up this map — it never
 * decides which page it is on.
 */
export const AD_PLACEMENTS: Record<PlacementId, AdPlacement> = {
  /* Home (/) */
  "home-leaderboard": {
    placementId: "home-leaderboard",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "home-infeed-1": {
    placementId: "home-infeed-1",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "home-infeed-2": {
    placementId: "home-infeed-2",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "home-mid": {
    placementId: "home-mid",
    formats: ["mpu", "banner", "mobile"],
    fallbackFormat: "mpu",
    label: "Advertisement",
  },
  "home-footer": {
    placementId: "home-footer",
    formats: ["billboard", "banner", "mobile"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* Ledger */
  "ledger-top": {
    placementId: "ledger-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "ledger-infeed": {
    placementId: "ledger-infeed",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "ledger-mid": {
    placementId: "ledger-mid",
    /* Second in-feed position, deeper in the table. Adsterra's guidance caps
       native blocks at two per page; this is the second one. */
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "ledger-bottom": {
    placementId: "ledger-bottom",
    formats: ["billboard", "banner", "mobile"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* Companies */
  "companies-top": {
    placementId: "companies-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "companies-infeed": {
    placementId: "companies-infeed",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "companies-mid": {
    placementId: "companies-mid",
    formats: ["mpu", "banner", "mobile"],
    fallbackFormat: "mpu",
    label: "Advertisement",
  },
  "companies-bottom": {
    placementId: "companies-bottom",
    formats: ["billboard", "banner", "mobile"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* Markets */
  "markets-top": {
    placementId: "markets-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "markets-sidebar-mpu": {
    placementId: "markets-sidebar-mpu",
    /* banner160 first: the live zone is a 160x600 skyscraper served from a
       `/22/` atOptions URL. `mpu` stays as the fallback so a 300x250 zone
       pasted here later still renders with the right reserved box. */
    formats: ["banner160", "mpu", "banner"],
    fallbackFormat: "mpu",
    label: "Advertisement",
  },
  "markets-infeed": {
    placementId: "markets-infeed",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "markets-bottom": {
    placementId: "markets-bottom",
    formats: ["billboard", "banner", "mobile"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* News */
  "news-top": {
    placementId: "news-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "news-infeed": {
    placementId: "news-infeed",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "news-bottom": {
    placementId: "news-bottom",
    formats: ["billboard", "banner", "mobile"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* Methodology */
  "methodology-top": {
    placementId: "methodology-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "methodology-infeed": {
    placementId: "methodology-infeed",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "methodology-bottom": {
    placementId: "methodology-bottom",
    formats: ["mpu", "banner", "mobile"],
    fallbackFormat: "mpu",
    label: "Advertisement",
  },

  /* 2000 vs 2026 comparison */
  "dotcom-top": {
    placementId: "dotcom-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "dotcom-infeed": {
    placementId: "dotcom-infeed",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "dotcom-bottom": {
    placementId: "dotcom-bottom",
    formats: ["billboard", "banner", "mobile"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* Visualize */
  "visualize-top": {
    placementId: "visualize-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "visualize-infeed": {
    placementId: "visualize-infeed",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "visualize-bottom": {
    placementId: "visualize-bottom",
    formats: ["mpu", "banner", "mobile"],
    fallbackFormat: "mpu",
    label: "Advertisement",
  },

  /* Sandbox */
  "sandbox-top": {
    placementId: "sandbox-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "sandbox-infeed": {
    placementId: "sandbox-infeed",
    formats: ["mpu", "banner", "mobile"],
    fallbackFormat: "mpu",
    label: "Advertisement",
  },
  "sandbox-bottom": {
    placementId: "sandbox-bottom",
    formats: ["billboard", "banner", "mobile"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* API docs */
  "api-docs-top": {
    placementId: "api-docs-top",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "api-docs-bottom": {
    placementId: "api-docs-bottom",
    formats: ["billboard", "banner", "mobile"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* Site-wide */
  "global-leaderboard": {
    placementId: "global-leaderboard",
    formats: ["banner", "mobile"],
    fallbackFormat: "banner",
    label: "Advertisement",
    eager: true,
  },
  "global-infeed": {
    placementId: "global-infeed",
    formats: ["native", "mpu"],
    fallbackFormat: "native",
    label: "Advertisement",
  },
  "global-footer-billboard": {
    placementId: "global-footer-billboard",
    formats: ["billboard", "banner", "native"],
    fallbackFormat: "billboard",
    label: "Advertisement",
  },

  /* Social bar — DEFAULT OFF. Needs a zone script AND
     NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_ENABLED=1 before it renders. */
  "social-bar": {
    placementId: "social-bar",
    formats: ["social-bar"],
    fallbackFormat: "social-bar",
    label: "Advertisement",
    defaultOff: true,
  },
};

/* ── Env plumbing ───────────────────────────────────────────────────────── */

/**
 * Env lookup, written out in full because Next.js only inlines
 * `process.env.NEXT_PUBLIC_X` when the property access is literal.
 */
const PLACEMENT_ENV: Record<PlacementId, string | undefined> = {
  "home-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_HOME_LEADERBOARD,
  "home-infeed-1": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_1,
  "home-infeed-2": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_2,
  "home-mid": process.env.NEXT_PUBLIC_ADSTERRA_HOME_MID,
  "home-footer": process.env.NEXT_PUBLIC_ADSTERRA_HOME_FOOTER,
  "ledger-top": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_TOP,
  "ledger-infeed": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_INFEED,
  "ledger-mid": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_MID,
  "ledger-bottom": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_BOTTOM,
  "companies-top": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_TOP,
  "companies-infeed": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_INFEED,
  "companies-mid": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_MID,
  "companies-bottom": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_BOTTOM,
  "markets-top": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_TOP,
  "markets-sidebar-mpu": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_SIDEBAR_MPU,
  "markets-infeed": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_INFEED,
  "markets-bottom": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_BOTTOM,
  "news-top": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_TOP,
  "news-infeed": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_INFEED,
  "news-bottom": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_BOTTOM,
  "methodology-top": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_TOP,
  "methodology-infeed": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_INFEED,
  "methodology-bottom": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_BOTTOM,
  "dotcom-top": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_TOP,
  "dotcom-infeed": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_INFEED,
  "dotcom-bottom": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_BOTTOM,
  "visualize-top": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_TOP,
  "visualize-infeed": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_INFEED,
  "visualize-bottom": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_BOTTOM,
  "sandbox-top": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_TOP,
  "sandbox-infeed": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_INFEED,
  "sandbox-bottom": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_BOTTOM,
  "api-docs-top": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_TOP,
  "api-docs-bottom": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_BOTTOM,
  "global-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_LEADERBOARD,
  "global-infeed": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_INFEED,
  "global-footer-billboard":
    process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_FOOTER_BILLBOARD,
  "social-bar": process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR,
};

/**
 * Optional PHONE-SIZED twin for a fixed-size `/22/` placement:
 * `..._<PLACEMENT>_MOBILE` (a second zone URL) and `..._<PLACEMENT>_MOBILE_SIZE`.
 *
 * These are STATIC literal lookups on purpose. Next.js only inlines
 * `process.env.NEXT_PUBLIC_*` when the property is written out literally, so a
 * computed lookup (e.g. `process.env[`...${id}`]`) is undefined in the client
 * bundle — and a slot that resolves its config on the server but not on the
 * client hydrates into a different tree (React #418/#422, full client
 * re-render). The lookup is spelled out for every placement so the server and
 * the browser always read the same value.
 */
const PLACEMENT_MOBILE_ENV: Record<PlacementId, string | undefined> = {
  "home-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_HOME_LEADERBOARD_MOBILE,
  "home-infeed-1": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_1_MOBILE,
  "home-infeed-2": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_2_MOBILE,
  "home-mid": process.env.NEXT_PUBLIC_ADSTERRA_HOME_MID_MOBILE,
  "home-footer": process.env.NEXT_PUBLIC_ADSTERRA_HOME_FOOTER_MOBILE,
  "ledger-top": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_TOP_MOBILE,
  "ledger-infeed": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_INFEED_MOBILE,
  "ledger-mid": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_MID_MOBILE,
  "ledger-bottom": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_BOTTOM_MOBILE,
  "companies-top": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_TOP_MOBILE,
  "companies-infeed": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_INFEED_MOBILE,
  "companies-mid": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_MID_MOBILE,
  "companies-bottom": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_BOTTOM_MOBILE,
  "markets-top": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_TOP_MOBILE,
  "markets-sidebar-mpu": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_SIDEBAR_MPU_MOBILE,
  "markets-infeed": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_INFEED_MOBILE,
  "markets-bottom": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_BOTTOM_MOBILE,
  "news-top": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_TOP_MOBILE,
  "news-infeed": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_INFEED_MOBILE,
  "news-bottom": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_BOTTOM_MOBILE,
  "methodology-top": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_TOP_MOBILE,
  "methodology-infeed": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_INFEED_MOBILE,
  "methodology-bottom": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_BOTTOM_MOBILE,
  "dotcom-top": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_TOP_MOBILE,
  "dotcom-infeed": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_INFEED_MOBILE,
  "dotcom-bottom": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_BOTTOM_MOBILE,
  "visualize-top": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_TOP_MOBILE,
  "visualize-infeed": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_INFEED_MOBILE,
  "visualize-bottom": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_BOTTOM_MOBILE,
  "sandbox-top": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_TOP_MOBILE,
  "sandbox-infeed": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_INFEED_MOBILE,
  "sandbox-bottom": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_BOTTOM_MOBILE,
  "api-docs-top": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_TOP_MOBILE,
  "api-docs-bottom": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_BOTTOM_MOBILE,
  "global-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_LEADERBOARD_MOBILE,
  "global-infeed": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_INFEED_MOBILE,
  "global-footer-billboard": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_FOOTER_BILLBOARD_MOBILE,
  "social-bar": process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_MOBILE,
};

/** Optional per-placement size override for the phone-sized twin (`160x300`). */
const PLACEMENT_MOBILE_SIZE_ENV: Record<PlacementId, string | undefined> = {
  "home-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_HOME_LEADERBOARD_MOBILE_SIZE,
  "home-infeed-1": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_1_MOBILE_SIZE,
  "home-infeed-2": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_2_MOBILE_SIZE,
  "home-mid": process.env.NEXT_PUBLIC_ADSTERRA_HOME_MID_MOBILE_SIZE,
  "home-footer": process.env.NEXT_PUBLIC_ADSTERRA_HOME_FOOTER_MOBILE_SIZE,
  "ledger-top": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_TOP_MOBILE_SIZE,
  "ledger-infeed": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_INFEED_MOBILE_SIZE,
  "ledger-mid": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_MID_MOBILE_SIZE,
  "ledger-bottom": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_BOTTOM_MOBILE_SIZE,
  "companies-top": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_TOP_MOBILE_SIZE,
  "companies-infeed": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_INFEED_MOBILE_SIZE,
  "companies-mid": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_MID_MOBILE_SIZE,
  "companies-bottom": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_BOTTOM_MOBILE_SIZE,
  "markets-top": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_TOP_MOBILE_SIZE,
  "markets-sidebar-mpu": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_SIDEBAR_MPU_MOBILE_SIZE,
  "markets-infeed": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_INFEED_MOBILE_SIZE,
  "markets-bottom": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_BOTTOM_MOBILE_SIZE,
  "news-top": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_TOP_MOBILE_SIZE,
  "news-infeed": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_INFEED_MOBILE_SIZE,
  "news-bottom": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_BOTTOM_MOBILE_SIZE,
  "methodology-top": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_TOP_MOBILE_SIZE,
  "methodology-infeed": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_INFEED_MOBILE_SIZE,
  "methodology-bottom": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_BOTTOM_MOBILE_SIZE,
  "dotcom-top": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_TOP_MOBILE_SIZE,
  "dotcom-infeed": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_INFEED_MOBILE_SIZE,
  "dotcom-bottom": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_BOTTOM_MOBILE_SIZE,
  "visualize-top": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_TOP_MOBILE_SIZE,
  "visualize-infeed": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_INFEED_MOBILE_SIZE,
  "visualize-bottom": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_BOTTOM_MOBILE_SIZE,
  "sandbox-top": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_TOP_MOBILE_SIZE,
  "sandbox-infeed": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_INFEED_MOBILE_SIZE,
  "sandbox-bottom": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_BOTTOM_MOBILE_SIZE,
  "api-docs-top": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_TOP_MOBILE_SIZE,
  "api-docs-bottom": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_BOTTOM_MOBILE_SIZE,
  "global-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_LEADERBOARD_MOBILE_SIZE,
  "global-infeed": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_INFEED_MOBILE_SIZE,
  "global-footer-billboard": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_FOOTER_BILLBOARD_MOBILE_SIZE,
  "social-bar": process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_MOBILE_SIZE,
};


/** Optional per-placement container id overrides (`..._<PLACEMENT>_ID`). */
const PLACEMENT_CONTAINER_ENV: Record<PlacementId, string | undefined> = {
  "home-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_HOME_LEADERBOARD_ID,
  "home-infeed-1": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_1_ID,
  "home-infeed-2": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_2_ID,
  "home-mid": process.env.NEXT_PUBLIC_ADSTERRA_HOME_MID_ID,
  "home-footer": process.env.NEXT_PUBLIC_ADSTERRA_HOME_FOOTER_ID,
  "ledger-top": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_TOP_ID,
  "ledger-infeed": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_INFEED_ID,
  "ledger-mid": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_MID_ID,
  "ledger-bottom": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_BOTTOM_ID,
  "companies-top": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_TOP_ID,
  "companies-infeed": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_INFEED_ID,
  "companies-mid": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_MID_ID,
  "companies-bottom": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_BOTTOM_ID,
  "markets-top": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_TOP_ID,
  "markets-sidebar-mpu": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_SIDEBAR_MPU_ID,
  "markets-infeed": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_INFEED_ID,
  "markets-bottom": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_BOTTOM_ID,
  "news-top": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_TOP_ID,
  "news-infeed": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_INFEED_ID,
  "news-bottom": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_BOTTOM_ID,
  "methodology-top": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_TOP_ID,
  "methodology-infeed": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_INFEED_ID,
  "methodology-bottom": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_BOTTOM_ID,
  "dotcom-top": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_TOP_ID,
  "dotcom-infeed": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_INFEED_ID,
  "dotcom-bottom": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_BOTTOM_ID,
  "visualize-top": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_TOP_ID,
  "visualize-infeed": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_INFEED_ID,
  "visualize-bottom": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_BOTTOM_ID,
  "sandbox-top": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_TOP_ID,
  "sandbox-infeed": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_INFEED_ID,
  "sandbox-bottom": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_BOTTOM_ID,
  "api-docs-top": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_TOP_ID,
  "api-docs-bottom": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_BOTTOM_ID,
  "global-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_LEADERBOARD_ID,
  "global-infeed": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_INFEED_ID,
  "global-footer-billboard":
    process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_FOOTER_BILLBOARD_ID,
  "social-bar": process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_ID,
};

/**
 * Optional per-placement creative size override (`..._<PLACEMENT>_SIZE`),
 * written as `160x600`. Only needed when a `/22/` zone's unit is not the
 * resolved format's intrinsic size. Unparseable values are ignored.
 */
const PLACEMENT_SIZE_ENV: Record<PlacementId, string | undefined> = {
  "home-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_HOME_LEADERBOARD_SIZE,
  "home-infeed-1": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_1_SIZE,
  "home-infeed-2": process.env.NEXT_PUBLIC_ADSTERRA_HOME_INFEED_2_SIZE,
  "home-mid": process.env.NEXT_PUBLIC_ADSTERRA_HOME_MID_SIZE,
  "home-footer": process.env.NEXT_PUBLIC_ADSTERRA_HOME_FOOTER_SIZE,
  "ledger-top": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_TOP_SIZE,
  "ledger-infeed": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_INFEED_SIZE,
  "ledger-mid": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_MID_SIZE,
  "ledger-bottom": process.env.NEXT_PUBLIC_ADSTERRA_LEDGER_BOTTOM_SIZE,
  "companies-top": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_TOP_SIZE,
  "companies-infeed": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_INFEED_SIZE,
  "companies-mid": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_MID_SIZE,
  "companies-bottom": process.env.NEXT_PUBLIC_ADSTERRA_COMPANIES_BOTTOM_SIZE,
  "markets-top": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_TOP_SIZE,
  "markets-sidebar-mpu": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_SIDEBAR_MPU_SIZE,
  "markets-infeed": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_INFEED_SIZE,
  "markets-bottom": process.env.NEXT_PUBLIC_ADSTERRA_MARKETS_BOTTOM_SIZE,
  "news-top": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_TOP_SIZE,
  "news-infeed": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_INFEED_SIZE,
  "news-bottom": process.env.NEXT_PUBLIC_ADSTERRA_NEWS_BOTTOM_SIZE,
  "methodology-top": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_TOP_SIZE,
  "methodology-infeed": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_INFEED_SIZE,
  "methodology-bottom": process.env.NEXT_PUBLIC_ADSTERRA_METHODOLOGY_BOTTOM_SIZE,
  "dotcom-top": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_TOP_SIZE,
  "dotcom-infeed": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_INFEED_SIZE,
  "dotcom-bottom": process.env.NEXT_PUBLIC_ADSTERRA_DOTCOM_BOTTOM_SIZE,
  "visualize-top": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_TOP_SIZE,
  "visualize-infeed": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_INFEED_SIZE,
  "visualize-bottom": process.env.NEXT_PUBLIC_ADSTERRA_VISUALIZE_BOTTOM_SIZE,
  "sandbox-top": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_TOP_SIZE,
  "sandbox-infeed": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_INFEED_SIZE,
  "sandbox-bottom": process.env.NEXT_PUBLIC_ADSTERRA_SANDBOX_BOTTOM_SIZE,
  "api-docs-top": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_TOP_SIZE,
  "api-docs-bottom": process.env.NEXT_PUBLIC_ADSTERRA_API_DOCS_BOTTOM_SIZE,
  "global-leaderboard": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_LEADERBOARD_SIZE,
  "global-infeed": process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_INFEED_SIZE,
  "global-footer-billboard":
    process.env.NEXT_PUBLIC_ADSTERRA_GLOBAL_FOOTER_BILLBOARD_SIZE,
  "social-bar": process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_SIZE,
};

/** Global kill switch. */
const KILL_SWITCH =
  process.env.NEXT_PUBLIC_ADSTERRA_DISABLED === "1" ||
  process.env.NEXT_PUBLIC_ADSTERRA_DISABLED === "true";

/** The social bar is opt-in even when a zone script exists. */
const SOCIAL_BAR_OPT_IN =
  process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_ENABLED === "1" ||
  process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_ENABLED === "true";

/** Accept absolute and protocol-relative URLs only; ignore anything else. */
function normalizeScriptUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) return trimmed;
  return null;
}

/* ── Zone-shape detection ────────────────────────────────────────────────── */

/**
 * How the Adsterra zone wants to be loaded. Switched purely on the path
 * segment of the invocation URL, so pasting any zone URL into any env value
 * is enough — no per-zone config on our side.
 *
 *  - `native-container`  `/21/<key>` — renders INTO a container div by id.
 *  - `at-options-iframe` `/22/<key>` — `document.write`s an iframe, and needs
 *                           an `atOptions` global defined first. Must be
 *                           isolated in a child document (see AdSlot).
 *  - `script-container`  anything else — the historical behaviour: run the
 *                           script into our own container div.
 */
export type AdZonePattern =
  | "native-container"
  | "at-options-iframe"
  | "script-container";

export interface AdZoneShape {
  pattern: AdZonePattern;
  /** The zone hash Adsterra puts in the URL path, e.g. `d09cdf…`. */
  zoneKey: string | null;
  /** Container id the zone itself expects (`container-<zoneKey>`). */
  impliedContainerId: string | null;
}

/** Adsterra zone keys are long alphanumeric hashes. Be permissive. */
const ZONE_KEY_RE = /^[A-Za-z0-9]{16,64}$/;

/**
 * Classify an invocation URL. Never throws: an unparseable URL is treated as
 * the generic `script-container` shape.
 */
export function detectAdZoneShape(scriptSrc: string): AdZoneShape {
  const fallback: AdZoneShape = {
    pattern: "script-container",
    zoneKey: null,
    impliedContainerId: null,
  };
  try {
    const url = new URL(scriptSrc);
    const segments = url.pathname.split("/").filter(Boolean);
    const zoneKey = [...segments].reverse().find((s) => ZONE_KEY_RE.test(s)) ?? null;

    if (segments.includes("21")) {
      return {
        pattern: "native-container",
        zoneKey,
        impliedContainerId: zoneKey ? `container-${zoneKey}` : null,
      };
    }
    if (segments.includes("22")) {
      return { pattern: "at-options-iframe", zoneKey, impliedContainerId: null };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Pick the format for a zone: the shape's natural format when the placement
 * allows it, else the placement's declared fallback, else its first allowed
 * format. This is why `/22/` zones land on `banner160` and `/21/` zones on
 * `native` without anyone editing the registry.
 */
function pickFormat(placement: AdPlacement, shape: AdZoneShape): AdFormatId {
  const allowed: readonly AdFormatId[] =
    placement.formats && placement.formats.length > 0
      ? placement.formats
      : [placement.fallbackFormat];
  /* `/22/` zones carry a fixed unit. Prefer the sizes those zones actually
     ship — 160x600 skyscraper, then 300x250 rectangle — before falling back,
     so the reserved box matches the creative even when a page pastes an MPU
     into a slot that also allows native. */
  const preferred: AdFormatId =
    shape.pattern === "at-options-iframe"
      ? allowed.includes("banner160")
        ? "banner160"
        : allowed.includes("mpu")
          ? "mpu"
          : placement.fallbackFormat
      : shape.pattern === "native-container"
        ? "native"
        : placement.fallbackFormat;

  if (allowed.includes(preferred)) return preferred;
  if (allowed.includes(placement.fallbackFormat)) return placement.fallbackFormat;
  return allowed[0];
}

/** `160x600` -> { width: 160, height: 600 }. Ignores anything else. */
function parseSizeOverride(
  raw: string | undefined | null
): { width: number; height: number } | null {
  if (!raw) return null;
  const m = /^\s*(\d{2,4})\s*[x×]\s*(\d{2,4})\s*$/i.exec(raw);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (width < 20 || height < 20 || width > 2000 || height > 2000) return null;
  return { width, height };
}

/**
 * Container id precedence:
 *   1. `NEXT_PUBLIC_ADSTERRA_<PLACEMENT>_ID` (validated as a DOM id token)
 *   2. the id Adsterra itself looks up for a native zone — `container-<zoneKey>`
 *   3. ours: `ad-<placementId>`
 */
function resolveContainerId(placementId: PlacementId, shape: AdZoneShape): string {
  const override = PLACEMENT_CONTAINER_ENV[placementId]?.trim();
  if (override && /^[A-Za-z][\w-]*$/.test(override)) return override;
  if (shape.pattern === "native-container" && shape.impliedContainerId) {
    return shape.impliedContainerId;
  }
  return `ad-${placementId.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

/* ── Public API ─────────────────────────────────────────────────────────── */

export interface AdSlotConfig {
  placementId: PlacementId;
  format: AdFormatId;
  /** The Adsterra invocation URL taken from env. */
  scriptSrc: string;
  /** id of the container div the loader writes into. */
  containerId: string;
  label: string;
  strategy: "afterInteractive" | "lazyOnload";
  /** Reserved-space class list, e.g. "ad-slot ad-slot--billboard". */
  slotClassName: string;
  /** Which Adsterra snippet shape this zone uses. */
  pattern: AdZonePattern;
  /** Zone hash from the invocation URL (drives the `atOptions.key`). */
  zoneKey: string | null;
  /**
   * True for `/22/` zones: the invocation script must be run inside a child
   * document, never in the React-owned page. AdSlot renders the isolation
   * iframe and no next/script at all.
   */
  isolateInIframe: boolean;
  /** Pinned creative geometry for the isolation iframe. Null when fluid. */
  size: { width: number; height: number } | null;
  /**
   * Phone-sized twin of a fixed-size `/22/` creative, when one is configured
   * (`..._<PLACEMENT>_MOBILE`). Rendered below the `md` breakpoint; the desktop
   * creative is hidden there so a wide banner is never cropped on a phone.
   */
  mobile: {
    scriptSrc: string;
    zoneKey: string;
    size: { width: number; height: number };
  } | null;
}

/** True for ids present in the registry. */
export function isKnownPlacement(value: string): value is PlacementId {
  return Object.prototype.hasOwnProperty.call(AD_PLACEMENTS, value);
}

/**
 * Resolve a placement id into the render config, or `null` when the slot is
 * not configured (no env value, unknown id, or kill switch on).
 * Never throws — a broken ad config must never break a page.
 */
export function resolveAdPlacement(
  placementId: string | null | undefined
): AdSlotConfig | null {
  try {
    if (KILL_SWITCH) return null;
    if (!placementId || !isKnownPlacement(placementId)) return null;

    const placement = AD_PLACEMENTS[placementId];
    if (!placement) return null;

    const scriptSrc = normalizeScriptUrl(PLACEMENT_ENV[placementId]);
    if (!scriptSrc) return null;
    if (placement.defaultOff && !SOCIAL_BAR_OPT_IN) return null;

    // Which snippet shape is this zone? Detected from the URL itself.
    const shape = detectAdZoneShape(scriptSrc);

    // Non-intrusive guarantee (see the file header): only the two banner
    // shapes are accepted. A popunder, direct-link or interstitial snippet
    // classifies as `script-container`; reject it silently so it can never
    // execute on the page. The social bar keeps its own opt-in path.
    if (shape.pattern === "script-container" && placementId !== "social-bar") {
      return null;
    }

    // Placement -> format: shape's natural format when allowed, else the
    // declared fallback. One snippet type therefore maps cleanly onto one CSS
    // class (and one reserved box).
    const format = pickFormat(placement, shape);

    // `/22/` zones document.write an iframe at a fixed size. Pin the geometry
    // so the reserved box and the creative agree exactly (zero CLS).
    const size =
      shape.pattern === "at-options-iframe"
        ? parseSizeOverride(PLACEMENT_SIZE_ENV[placementId]) ??
          adFormatSize(format) ?? { width: 300, height: 250 }
        : null;

    // A phone-sized twin for a fixed-size banner (see PLACEMENT_MOBILE_ENV). Only a
    // `/22/` zone can have one — a native unit is already fluid.
    let mobile: AdSlotConfig["mobile"] = null;
    if (shape.pattern === "at-options-iframe") {
      const mobileSrc = normalizeScriptUrl(PLACEMENT_MOBILE_ENV[placementId]);
      if (mobileSrc) {
        const mobileShape = detectAdZoneShape(mobileSrc);
        if (mobileShape.pattern === "at-options-iframe" && mobileShape.zoneKey) {
          mobile = {
            scriptSrc: mobileSrc,
            zoneKey: mobileShape.zoneKey,
            size:
              parseSizeOverride(PLACEMENT_MOBILE_SIZE_ENV[placementId]) ??
              adFormatSize("mobile") ?? { width: 320, height: 50 },
          };
        }
      }
    }

    return {
      placementId: placement.placementId,
      format,
      scriptSrc,
      containerId: resolveContainerId(placement.placementId, shape),
      label: placement.label || "Advertisement",
      strategy: placement.eager ? "afterInteractive" : "lazyOnload",
      slotClassName: `ad-slot ad-slot--${format}`,
      pattern: shape.pattern,
      zoneKey: shape.zoneKey,
      isolateInIframe: shape.pattern === "at-options-iframe",
      size,
      mobile,
    };
  } catch {
    // Defensive: ad plumbing must never take a page down.
    return null;
  }
}

/** True when at least one placement on the site has a zone script configured. */
export const ADSTERRA_ENABLED: boolean = !KILL_SWITCH &&
  (Object.keys(AD_PLACEMENTS) as PlacementId[]).some(
    (id) => normalizeScriptUrl(PLACEMENT_ENV[id]) !== null
  );

/** Format metadata lookup (safe for unknown ids). */
export function getAdFormat(formatId: string): AdFormat | null {
  return (AD_FORMATS as Record<string, AdFormat>)[formatId] ?? null;
}

/**
 * Env var name for a placement — handy for docs and debugging.
 */
export function envKeyFor(placementId: PlacementId): string {
  return `NEXT_PUBLIC_ADSTERRA_${placementId.toUpperCase().replace(/-/g, "_")}`;
}

/**
 * ── Legacy shim ────────────────────────────────────────────────────────────
 * Pages still written against the old
 * `<AdSlot format="leaderboard" slotId="ledger-top" />` API keep typechecking
 * while they migrate. Map them onto real placements, then delete this table
 * once every call site passes `placementId` directly.
 */
export const LEGACY_PLACEMENT_MAP: Record<string, PlacementId> = {
  "leaderboard:ledger-top": "ledger-top",
  "leaderboard:viz-top-banner": "visualize-top",
  "in-feed:viz-mid-native": "visualize-infeed",
  "in-feed:ledger-mid": "ledger-infeed",
  "rectangle:*": "global-infeed",
  "banner:*": "global-leaderboard",
  "in-feed:*": "global-infeed",
  "leaderboard:*": "global-leaderboard",
};

/** Resolve a legacy `format` + `slotId` pair to a placement id. */
export function legacyPlacementId(
  format: string | undefined,
  slotId: string | undefined
): PlacementId | null {
  const fmt = (format || "leaderboard").toLowerCase();
  const exact = LEGACY_PLACEMENT_MAP[`${fmt}:${(slotId || "").toLowerCase()}`];
  if (exact) return exact;
  return LEGACY_PLACEMENT_MAP[`${fmt}:*`] ?? null;
}