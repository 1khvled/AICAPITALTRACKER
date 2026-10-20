import {
  resolveAdPlacement,
  legacyPlacementId,
  type PlacementId,
} from "@/lib/ads";
import { AdScript } from "@/components/AdScript";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * <AdSlot /> — the only ad surface on the site.
 * ─────────────────────────────────────────────────────────────────────────────
 * CONTRACT
 *   <AdSlot placementId="home-leaderboard" className="mt-6" />
 *
 *   * `placementId` is a lookup key only. This component has no knowledge of
 *     which page it is on and never hardcodes placements per page — the
 *     registry lives in `src/lib/ads.ts`.
 *   * UNCONFIGURED -> renders NOTHING. No empty box, no reserved gap, no
 *     console warning. A page with three unconfigured slots is byte-identical
 *     to a page with none.
 *   * CONFIGURED (env value present) -> reserves the exact height of the
 *     format (`.ad-slot--<format>` in globals.css) and then loads the Adsterra
 *     invocation script client-side with next/script. Reserved space first,
 *     creative second: zero cumulative layout shift.
 *   * Slots never throw. A malformed env value is treated as "not configured".
 *
 * TWO ZONE SHAPES, PICKED AUTOMATICALLY FROM THE ZONE URL
 *   /21/<key>  NATIVE BANNER — renders into a container div looked up by id.
 *              The div is server-rendered (so it exists before any script runs)
 *              and the invocation script loads after hydration. Container id
 *              comes from `..._<PLACEMENT>_ID`, else `container-<key>`.
 *   /22/<key>  CLASSIC BANNER (160x600 etc.) — Adsterra expects an `atOptions`
 *              global and then calls `document.write('<iframe …>')`.
 *              document.write in a React-owned document destroys the page, so
 *              this shape is NEVER loaded with next/script. It renders a nested
 *              <iframe srcDoc="…"> carrying both snippets; document.write then
 *              lands in the throwaway child document.
 *   Detection + id resolution live in `src/lib/ads.ts`.
 *
 * DEDUPLICATION
 *   next/script caches by `src`, so a zone URL configured on two placements can
 *   only ever execute once per page — the second slot stays empty rather than
 *   double-rendering. Each slot still owns its own container id.
 *
 * HOW TO ENABLE (no code change)
 *   Paste the Adsterra zone invocation URL into `.env.local`:
 *
 *     NEXT_PUBLIC_ADSTERRA_HOME_INFEED_1=https://<host>/21/<zoneKey>
 *     NEXT_PUBLIC_ADSTERRA_HOME_INFEED_1_ID=container-<zoneKey>
 *     NEXT_PUBLIC_ADSTERRA_MARKETS_SIDEBAR_MPU=https://<host>/22/<zoneKey>
 *
 *   Key rule: `NEXT_PUBLIC_ADSTERRA_` + placement id, uppercased, dashes as
 *   underscores. Nothing renders until the value exists.
 *   Kill switch: `NEXT_PUBLIC_ADSTERRA_DISABLED=1`.
 *
 * PLACEMENT IDS
 *   home-leaderboard, home-infeed-1, home-infeed-2, home-mid, home-footer,
 *   ledger-top, ledger-infeed, ledger-mid, ledger-bottom,
 *   companies-top, companies-infeed, companies-mid, companies-bottom,
 *   markets-top, markets-sidebar-mpu, markets-infeed, markets-bottom,
 *   news-top, news-infeed, news-bottom,
 *   methodology-top, methodology-infeed, methodology-bottom,
 *   dotcom-top, dotcom-infeed, dotcom-bottom,
 *   visualize-top, visualize-infeed, visualize-bottom,
 *   sandbox-top, sandbox-infeed, sandbox-bottom,
 *   api-docs-top, api-docs-bottom,
 *   global-leaderboard, global-infeed, global-footer-billboard,
 *   social-bar (default off)
 *
 * RESERVED-HEIGHT CLASSES
 *   .ad-slot--banner (90px, 50px under 768px)
 *   .ad-slot--mobile (50px)
 *   .ad-slot--billboard (100px / 120px / 250px by breakpoint)
 *   .ad-slot--mpu (250px)
 *   .ad-slot--banner160 (600px, 160px wide; hidden below xl)
 *   .ad-slot--native (120px, 160px from 768px)
 *   .ad-slot--social-bar (fixed 50px bar, opt-in only)
 *
 * NOTE ON CASCADE
 *   The ad-slot rules live in `@layer components` so plain Tailwind utilities
 *   passed via `className` (e.g. `hidden xl:block`) still win over them.
 * ---------------------------------------------------------------------------
 */

/** Legacy `format` values kept only so un-migrated pages still typecheck. */
export type LegacyAdFormat = "leaderboard" | "in-feed" | "rectangle" | "banner";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * buildAtOptionsDoc — the `/22/` isolation document.
 * ─────────────────────────────────────────────────────────────────────────────
 * Adsterra's classic-banner snippet is two scripts:
 *
 *     <script>atOptions = { key: '<zoneKey>', format: 'iframe',
 *                          height: 600, width: 160, params: {} };</script>
 *     <script async data-cfasync="false" src="https://<host>/22/<zoneKey>"></script>
 *
 * The second one ends in `document.write('<iframe …>')`. Run in the page that
 * React owns, that replaces the entire document (and React's DOM with it).
 * So we hand both snippets to a nested iframe instead: the child document
 * parses the inline `atOptions` assignment first, then fetches and runs the
 * invocation script, and whatever it writes lands inside the child.
 *
 * Everything that could break out of the attribute context is stripped from the
 * URL — it has already passed `normalizeScriptUrl`, this is belt and braces.
 */
export function buildAtOptionsDoc(args: {
  scriptSrc: string;
  zoneKey: string;
  width: number;
  height: number;
}): string {
  const { scriptSrc, zoneKey, width, height } = args;
  const safeSrc = scriptSrc.replace(/[<>"'`]/g, "");
  const safeKey = zoneKey.replace(/[^A-Za-z0-9_-]/g, "");
  const options = JSON.stringify({
    key: safeKey,
    format: "iframe",
    height,
    width,
    params: {},
  });
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}" +
    "iframe{border:0;display:block}</style>" +
    "</head><body>" +
    // `window.atOptions = {...}` and NOT `var atOptions = {...}`: a var
    // declaration creates a NON-configurable global, and Adsterra's invocation
    // script does `delete window.atOptions` when it finishes — which throws on a
    // non-configurable property and takes the rest of their script down with it
    // ("Cannot delete property 'atOptions' of #<Window>").
    `<script>window.atOptions=${options};</script>` +
    `<script async data-cfasync="false" src="${safeSrc}"></script>` +
    "</body></html>"
  );
}

export interface AdSlotProps {
  /**
   * Stable placement id from `src/lib/ads.ts`. Optional only so that pages
   * still passing the deprecated `format` / `slotId` pair keep compiling
   * during the migration.
   */
  placementId?: PlacementId | (string & {});
  /** Extra classes on the reserved-space wrapper. */
  className?: string;
  /** @deprecated Pass `placementId` instead. */
  format?: LegacyAdFormat;
  /** @deprecated Pass `placementId` instead. */
  slotId?: string;
}

export function AdSlot({
  placementId,
  className,
  format,
  slotId,
}: AdSlotProps) {
  const requestedId: string | null =
    typeof placementId === "string" && placementId.length > 0
      ? placementId
      : legacyPlacementId(format, slotId);

  const ad = resolveAdPlacement(requestedId);

  // Not configured -> render nothing at all.
  if (!ad) return null;

  // A 160x600 skyscraper in a narrow rail is dead space on phones/tablets, so
  // the slot itself drops out below xl (reserved box and creative stay equal).
  const isTallRail = ad.format === "banner160";

  const wrapperClass = [
    ad.slotClassName,
    isTallRail ? "hidden xl:block" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const isSocialBar = ad.format === "social-bar";

  // `/22/` zones: no next/script. The invocation script lives inside the
  // child document so its document.write can never touch the host page.
  if (ad.isolateInIframe && ad.size && ad.zoneKey) {
    const { width, height } = ad.size;
    const mobile = ad.mobile;

    /**
     * 2026-10-19: a fixed-size creative wider than a phone cannot be shown
     * without being cropped, and half an ad is worse than no ad. With a
     * phone-sized twin configured (`..._<PLACEMENT>_MOBILE`) the twin is served
     * below `md` and the desktop creative steps out; without one, the whole
     * slot steps out below `md` instead of showing a cropped banner.
     */
    const tooWideForPhone = width > 320;
    const hideBelowMd = !mobile && tooWideForPhone;

    const creative = (variant: {
      scriptSrc: string;
      zoneKey: string;
      size: { width: number; height: number };
    }) => (
      <iframe
        title="Advertisement"
        srcDoc={buildAtOptionsDoc({
          scriptSrc: variant.scriptSrc,
          zoneKey: variant.zoneKey,
          width: variant.size.width,
          height: variant.size.height,
        })}
        width={variant.size.width}
        height={variant.size.height}
        style={{
          width: variant.size.width,
          height: variant.size.height,
          border: "0",
          display: "block",
          margin: 0,
        }}
        scrolling="no"
        frameBorder={0}
        marginWidth={0}
        marginHeight={0}
        loading="lazy"
        referrerPolicy="no-referrer"
        /*
          WHAT THIS SANDBOX GUARANTEES
          - `allow-top-navigation` is NOT granted, so a creative can open its own
            tab on a click but can never redirect this page. That is the promise
            the non-intrusive policy makes, and it holds.
          - Autoplay is not granted, so nothing ever makes noise on load.
          - `allow-forms` and popups cover ad destinations that submit or open
            in new tabs.

          WHAT IT DOES NOT
          `allow-same-origin` IS granted, and it has to be: Adsterra's invocation
          script reads `document.cookie` and throws a SecurityError without it,
          which kills the creative entirely (measured in a browser, not
          assumed). So the sandboxed document is same-origin with the page: the
          ad network's code could in principle read this page's localStorage or
          rewrite its DOM. That is the trade Adsterra's model forces, and it is
          stated here rather than glossed over. What we can still do is refuse
          to hand over the page address: `referrerPolicy="no-referrer"` above
          means the creative never learns which page it is sitting on.
        */
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
      />
    );

    return (
      <aside
        className={[wrapperClass, "ad-slot--sized", hideBelowMd ? "hidden md:block" : null]
          .filter(Boolean)
          .join(" ")}
        style={
          {
            "--ad-unit-h": `${height}px`,
            ...(mobile ? { "--ad-unit-h-mobile": `${mobile.size.height}px` } : {}),
          } as React.CSSProperties
        }
        aria-label={ad.label}
        role="complementary"
        data-placement={ad.placementId}
        data-format={ad.format}
        data-adsterra-pattern={ad.pattern}
      >
        <span className="ad-label" aria-hidden="true">
          Advertisement
        </span>
        {mobile ? (
          <>
            <div id={ad.containerId} className="ad-slot__frame hidden md:flex">
              {creative({ scriptSrc: ad.scriptSrc, zoneKey: ad.zoneKey, size: ad.size })}
            </div>
            <div className="ad-slot__frame md:hidden">
              {creative({ scriptSrc: mobile.scriptSrc, zoneKey: mobile.zoneKey, size: mobile.size })}
            </div>
          </>
        ) : (
          <div id={ad.containerId} className="ad-slot__frame">
            {creative({ scriptSrc: ad.scriptSrc, zoneKey: ad.zoneKey, size: ad.size })}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={wrapperClass}
      aria-label={ad.label}
      role="complementary"
      data-placement={ad.placementId}
      data-format={ad.format}
      data-adsterra-pattern={ad.pattern}
    >
      <span className="ad-label" aria-hidden="true">
        Advertisement
      </span>
      <div id={ad.containerId} className="ad-slot__frame" />
      {/* Viewport-gated loader: the third-party script is only injected once
          the slot nears the viewport (see AdScript). The reserved box above
          already exists, so nothing shifts when the creative arrives. */}
      <AdScript
        src={ad.scriptSrc}
        strategy={ad.strategy}
        id={`${ad.containerId}-loader`}
        placementId={ad.placementId}
        socialBar={isSocialBar}
      />
    </aside>
  );
}

export default AdSlot;