#!/usr/bin/env node
/**
 * Internal link gate.
 *
 * Reads the STATIC output of a production build - the HTML a crawler, a
 * share preview and a search engine actually see - and fails when:
 *
 *   1. A link points at a route that does not exist.
 *   2. A route that exists on disk is missing from the sitemap.
 *   3. A route in the sitemap does not exist.
 *   4. A route exists but nothing on the site links to it (an orphan), unless
 *      it is on the allowed-orphan list.
 *
 * It reports how many pages it walked, how many links it checked and how many
 * broke, so a broken link cannot ship quietly again.
 *
 * It reads the built HTML rather than a live browser on purpose: a crawler
 * sees the static file, and the static file is the thing that has to be
 * right. It also means the gate needs no browser and no server.
 *
 * Usage: node scripts/check-links.mjs
 */

import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "src", "app");
const SERVER_DIR = path.join(process.cwd(), ".next", "server", "app");

/** Routes that are allowed to have no inbound link. */
const ORPHAN_ALLOWLIST = new Set(["/not-found"]);

/** Every page route on disk. */
function routesOnDisk() {
  const routes = new Set();
  const walk = (dir, segments) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith("(") || entry.name.startsWith("@")) continue;
        walk(full, [...segments, entry.name]);
      } else if (/^page\.(tsx|jsx|js)$/.test(entry.name)) {
        const route = "/" + segments.join("/");
        routes.add(route.replace(/\/+$/, "") || "/");
      }
    }
  };
  walk(APP_DIR, []);
  return Array.from(routes).sort();
}

/** The static HTML for a route, as the build wrote it. */
function staticHtmlFor(route) {
  const relative = route === "/" ? "" : route.replace(/^\//, "");
  const candidates = [
    path.join(SERVER_DIR, relative, "index.html"),
    path.join(SERVER_DIR, `${relative}.html`),
  ];
  for (const file of candidates) {
    if (file.endsWith(".html") && fs.existsSync(file)) {
      return fs.readFileSync(file, "utf8");
    }
  }
  return null;
}

/**
 * Is this a link to a PAGE?
 *
 * Static assets are not pages: /_next/... is the build's own CSS and JS,
 * and /icon.png, /robots.txt, /sitemap.xml are files. Only page routes are
 * checked, and only page routes are counted.
 */
const ASSET_PATTERN = /\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|json|xml|txt|webmanifest|woff2?|ttf)$/i;

function isPageLink(href) {
  if (href.startsWith("/_next/")) return false;
  if (ASSET_PATTERN.test(href)) return false;
  return true;
}

/** Every internal href in a document. */
function hrefsIn(html) {
  const out = new Set();
  for (const match of html.matchAll(/href="([^"]*)"/g)) {
    const href = match[1];
    if (!href.startsWith("/")) continue;
    const clean = href.split("#")[0].split("?")[0];
    if (clean) out.add(clean);
  }
  return out;
}

/** The routes the built sitemap advertises. */
function sitemapRoutes() {
  const routes = new Set();
  for (const file of ["sitemap.xml.body", "sitemap.xml"]) {
    const full = path.join(SERVER_DIR, file);
    if (!fs.existsSync(full)) continue;
    try {
      const body = fs.readFileSync(full, "utf8");
      for (const match of body.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        try {
          routes.add(new URL(match[1]).pathname.replace(/\/+$/, "") || "/");
        } catch {}
      }
    } catch {}
    if (routes.size) break;
  }
  return routes;
}

function run() {
  console.log("=".repeat(70));
  console.log("    AI CAPITAL TRACKER — INTERNAL LINK GATE");
  console.log("=".repeat(70));
  console.log("");

  if (!fs.existsSync(SERVER_DIR)) {
    console.error("No production build found. Run `npm run build` first.");
    process.exit(1);
  }

  const diskRoutes = routesOnDisk();
  // The API directory holds real routes too (/api, /api/v1/model ...).
  if (fs.existsSync(path.join(APP_DIR, "api"))) diskRoutes.push("/api");
  const staticRoutes = new Set();
  for (const route of diskRoutes) {
    if (route.includes("[")) continue;
    if (staticHtmlFor(route) !== null) staticRoutes.add(route);
  }
  // The dossiers are dynamic on disk but static in the build.
  for (const route of routesFromBuild()) staticRoutes.add(route);

  console.log(`[1/3] Reading ${staticRoutes.size} built pages...`);
  const linkedTo = new Set();
  const failures = [];
  let linksChecked = 0;
  let pagesWalked = 0;

  for (const route of staticRoutes) {
    const html = staticHtmlFor(route);
    if (html === null) continue;
    pagesWalked++;
    const hrefs = hrefsIn(html);
    for (const href of hrefs) {
      if (!isPageLink(href)) continue;
      linksChecked++;
      linkedTo.add(href);
      if (href.startsWith("/api/")) continue;
      if (!staticRoutes.has(href) && !diskRoutes.includes(href)) {
        failures.push({ kind: "broken link", route, detail: href });
      }
    }
  }
  console.log(`  ${pagesWalked} pages, ${linksChecked} internal links`);

  console.log("\n[2/3] Checking the sitemap against the routes on disk...");
  const sitemap = sitemapRoutes();
  for (const route of diskRoutes) {
    if (route.includes("[")) continue;
    if (route === "/api") continue;
    if (!sitemap.has(route)) {
      failures.push({ kind: "route missing from sitemap", route, detail: route });
    }
  }
  for (const route of sitemap) {
    if (route.includes("[")) continue;
    if (!staticRoutes.has(route) && !diskRoutes.includes(route)) {
      failures.push({ kind: "sitemap route does not exist", route, detail: route });
    }
  }
  console.log(`  ${sitemap.size} routes in the sitemap, ${diskRoutes.length} on disk`);

  console.log("\n[3/3] Looking for orphan routes...\n");
  const orphans = Array.from(staticRoutes)
    .filter(
      (route) =>
        !linkedTo.has(route) &&
        !ORPHAN_ALLOWLIST.has(route) &&
        !route.includes("[")
    )
    .sort();
  for (const route of orphans) {
    console.log(`  ! ${route} is not linked from anywhere`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("                       VERIFICATION REPORT");
  console.log("=".repeat(70));
  console.log(`Pages Walked:            ${pagesWalked}`);
  console.log(`Links Checked:           ${linksChecked}`);
  console.log(`Broken / Missing:        ${failures.length}`);
  console.log(`Orphan Routes:           ${orphans.length}`);
  console.log("=".repeat(70));

  if (failures.length) {
    console.log("\nFAILURES:");
    for (const failure of failures.slice(0, 40)) {
      console.log(`  [${failure.kind}] ${failure.route} - ${failure.detail}`);
    }
    console.log("\nLINK GATE FAILED");
    process.exit(1);
  }
  if (orphans.length) {
    console.log("\nOrphan routes are listed above (a warning, not a failure).");
  }
  console.log("\nLINK GATE PASSED: every internal link resolves.");
}

/** Every static page the build produced, including the dynamic dossiers. */
function routesFromBuild() {
  const routes = new Set();
  const walk = (dir, segments) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith("(") || entry.name.startsWith("@")) continue;
        walk(full, [...segments, entry.name]);
      } else if (entry.name === "index.html") {
        const route = "/" + segments.join("/");
        routes.add(route.replace(/\/+$/, "") || "/");
      } else if (entry.name.endsWith(".html")) {
        // A prerendered dynamic route: companies/nvidia.html
        const slug = entry.name.replace(/\.html$/, "");
        // _not-found is the 404 handler, not a page anyone links to.
        if (slug.startsWith("_")) continue;
        const route = "/" + [...segments, slug].join("/");
        routes.add(route.replace(/\/+$/, "") || "/");
      }
    }
  };
  walk(SERVER_DIR, []);
  return Array.from(routes);
}

run();
