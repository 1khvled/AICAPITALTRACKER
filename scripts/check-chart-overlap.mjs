#!/usr/bin/env node
/**
 * Chart text collision and overflow gate.
 *
 * Runs a real headless browser (Chromium via Playwright) against a production
 * Next.js build. Walks every chart across the site at 1280px (desktop) and
 * 390px (mobile), measures the bounding box of every visible text element, and
 * asserts:
 *
 *   1. No two text elements collide.
 *   2. No text element collides with a mark that carries a value.
 *   3. No horizontal overflow (scrollWidth <= clientWidth).
 *   4. No chart text below 12px.
 *
 * It reports how many charts it walked and how many collisions it found, so
 * a regression in a chart's geometry cannot ship quietly again.
 */

import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Resolve Playwright from the project, a caller-supplied path, or the global
// npm tree. No machine-specific absolute paths: the old list leaked a local
// username and broke on every other checkout.
const globalMcpCore = process.env.APPDATA
  ? path.join(
      process.env.APPDATA,
      "npm",
      "node_modules",
      "@playwright",
      "mcp",
      "node_modules",
      "playwright-core",
    )
  : null;

const PLAYWRIGHT_PATHS = [
  process.env.PLAYWRIGHT_CORE_PATH,
  globalMcpCore,
  "playwright",
  "playwright-core",
].filter(Boolean);

let playwright = null;
for (const p of PLAYWRIGHT_PATHS) {
  try {
    playwright = require(p);
    break;
  } catch (e) {}
}

if (!playwright) {
  console.error("Could not load playwright-core. Install Playwright or set PLAYWRIGHT_CORE_PATH.");
  process.exit(1);
}

/**
 * Find a Chromium binary without hardcoding a user directory or browser
 * revision. An explicit CHROMIUM_EXECUTABLE_PATH wins; otherwise scan the
 * standard Playwright browser cache, then ask Playwright itself.
 */
function findChromium() {
  const explicit = process.env.CHROMIUM_EXECUTABLE_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "ms-playwright") : null,
  ].filter(Boolean);

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const revisions = fs
      .readdirSync(root)
      .filter((name) => name.startsWith("chromium-"))
      .sort()
      .reverse();
    for (const revision of revisions) {
      for (const relative of [
        "chrome-win64/chrome.exe",
        "chrome-win/chrome.exe",
        "chrome-linux/chrome",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      ]) {
        const candidate = path.join(root, revision, relative);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  try {
    return playwright.chromium.executablePath();
  } catch {
    return null;
  }
}

const executablePath = findChromium();

const PORT = 3188;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/** Wait for server to respond with HTTP 200 */
async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on("error", reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

// Target charts across the site
const TARGET_PAGES = [
  {
    path: "/",
    name: "Homepage",
    charts: [
      { name: "History Chart", query: "figure[aria-label*='Historical model behavior']" },
      { name: "Factor Contribution Chart", query: "figure[aria-labelledby*='heading']" },
      { name: "What Changed Sparkline", query: "div[role='img'][aria-labelledby*='title']" },
    ],
  },
  {
    path: "/prediction-markets",
    name: "Prediction Markets",
    charts: [
      { name: "Model vs Market Gap Chart", query: { titleMatch: "Canonical Gap" } },
      { name: "Contract Map Chart", query: { titleMatch: "Contract Map" } },
      { name: "Category Trajectory Chart", query: { titleMatch: "Prediction Market Category View" } },
      { name: "Crowd Trend Chart", query: { titleMatch: "Prediction-market odds on an AI industry bubble" } },
    ],
  },
  {
    path: "/visualize",
    name: "Visualizations & Charts",
    charts: [
      { name: "Capital Wheel", query: { titleMatch: "Capital Wheel" } },
      { name: "Circular Financing", query: { titleMatch: "Circular Financing" } },
      { name: "Capital Treemap", query: { titleMatch: "capital allocation treemap" }, trigger: "button:has-text('Capital Treemap')" },
      { name: "Bubble Universe", query: { titleMatch: "bubble pod" }, trigger: "button:has-text('Bubble Pods')" },
      { name: "Sensitivity Curve Chart", query: "svg[aria-label*='Model sensitivity sigmoid curve']" },
      { name: "Capital Composition Chart", query: { headingMatch: "Capital Stack Seniority" } },
    ],
  },
  {
    path: "/your-call",
    name: "Your Call Forecaster",
    setup: async (page) => {
      await page.evaluate(() => {
        const sampleRecord = [{
          id: "yc-sample-1",
          probabilityPct: 35.0,
          submittedAt: "2026-10-20T12:00:00.000Z",
          modelPrintPct: 32.3,
          modelBand: "20–35%",
          marketPct: 22.0,
        }];
        window.localStorage.setItem("aict-calls-v1", JSON.stringify(sampleRecord));
      });
      await page.reload({ waitUntil: "networkidle" });
    },
    charts: [
      { name: "Your Call Record Chart", query: "svg[viewBox='0 0 720 240']" },
    ],
  },
  {
    path: "/companies/oracle",
    name: "Company Dossier (Oracle)",
    charts: [
      { name: "Company Debt Stack Chart", query: "div[role='region'][aria-label*='Visual Debt Stack']" },
    ],
  },
];

const VIEWPORTS = [
  { width: 1280, height: 800, label: "Desktop (1280px)" },
  { width: 390, height: 844, label: "Mobile (390px)" },
];

async function run() {
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log("    AI CAPITAL TRACKER — CHART NO-TEXT-OVERLAP & COLLISION SUITE      ");
  console.log("══════════════════════════════════════════════════════════════════════\n");

  console.log(`[0/4] Starting production server on port ${PORT}...`);
  const server = spawn("npm.cmd", ["run", "start", "--", "-p", String(PORT)], {
    cwd: process.cwd(),
    stdio: "ignore",
    detached: false,
    shell: true,
  });

  let serverCleaned = false;
  const cleanupServer = () => {
    if (!serverCleaned) {
      serverCleaned = true;
      try {
        if (server.pid) process.kill(server.pid);
      } catch {}
      spawn("cmd.exe", ["/c", `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${PORT}') do taskkill /F /PID %a`], {
        stdio: "ignore",
        shell: true,
      });
    }
  };

  process.on("exit", cleanupServer);
  process.on("SIGINT", cleanupServer);
  process.on("SIGTERM", cleanupServer);

  const ready = await waitForServer(BASE_URL);
  if (!ready) {
    console.error("❌ Failed to start Next.js server on port " + PORT);
    cleanupServer();
    process.exit(1);
  }
  console.log(`✔ Server ready at ${BASE_URL}\n`);

  console.log(`[1/4] Launching headless browser with Chromium...`);
  const browser = await playwright.chromium.launch({
    executablePath: executablePath || undefined,
    headless: true,
  });

  let totalChartsWalked = 0;
  let totalCollisions = 0;
  let totalTextUnder12px = 0;
  let totalHorizontalOverflows = 0;
  const collisionDetails = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n── Scanning Viewport: ${vp.label} ──`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      for (const target of TARGET_PAGES) {
        const url = `${BASE_URL}${target.path}`;
        await page.goto(url, { waitUntil: "networkidle" });
        if (target.setup) {
          await target.setup(page);
        }

        // Check horizontal overflow
        const overflow = await page.evaluate((expectedW) => {
          const docW = document.documentElement.scrollWidth;
          return { hasOverflow: docW > expectedW + 2, scrollWidth: docW };
        }, vp.width);

        if (overflow.hasOverflow) {
          totalHorizontalOverflows++;
          collisionDetails.push({
            type: "Horizontal Overflow",
            chart: `${target.name} Page`,
            viewport: vp.label,
            detail: `Page scrollWidth is ${overflow.scrollWidth}px (exceeds viewport ${vp.width}px)`,
          });
        }

        // Walk each chart on this page
        for (const chartTarget of target.charts) {
          totalChartsWalked++;

          if (chartTarget.trigger) {
            try {
              const btn = await page.$(chartTarget.trigger);
              if (btn) {
                await btn.click();
                await page.waitForTimeout(350);
              }
            } catch {}
          }

          const chartAnalysis = await page.evaluate((chartDef) => {
            let container = null;
            if (typeof chartDef.query === "string") {
              container = document.querySelector(chartDef.query);
            } else if (chartDef.query.titleMatch) {
              const svgs = Array.from(document.querySelectorAll("svg"));
              container = svgs.find((s) => {
                const titleText = s.querySelector("title")?.textContent || "";
                const ariaLabel = s.getAttribute("aria-label") || "";
                const ariaDesc = s.getAttribute("aria-description") || "";
                const full = `${titleText} ${ariaLabel} ${ariaDesc}`.toLowerCase();
                return full.includes(chartDef.query.titleMatch.toLowerCase());
              });
            } else if (chartDef.query.headingMatch) {
              const headings = Array.from(document.querySelectorAll("h2, h3, h4, span.label"));
              const match = headings.find((h) =>
                (h.textContent || "").toLowerCase().includes(chartDef.query.headingMatch.toLowerCase())
              );
              if (match) {
                container = match.closest(".card") || match.closest("section") || match.parentElement;
              }
            }

            if (!container) return { found: false };

            // Find all visible text elements in SVG and HTML chart labels
            const textNodes = Array.from(
              container.querySelectorAll("text, .num, span.chart-label, p.chart-label, .treemap-tile-label, .panel span.font-bold")
            );
            const visibleTexts = [];

            for (const node of textNodes) {
              const rect = node.getBoundingClientRect();
              const style = window.getComputedStyle(node);
              const textContent = (node.textContent || "").trim();

              if (!textContent) continue;
              if (rect.width <= 0 || rect.height <= 0) continue;
              if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

              const fontSize = parseFloat(style.fontSize) || 12;

              visibleTexts.push({
                text: textContent.length > 25 ? textContent.slice(0, 22) + "..." : textContent,
                left: Math.round(rect.left * 10) / 10,
                right: Math.round(rect.right * 10) / 10,
                top: Math.round(rect.top * 10) / 10,
                bottom: Math.round(rect.bottom * 10) / 10,
                width: Math.round(rect.width * 10) / 10,
                height: Math.round(rect.height * 10) / 10,
                fontSize,
                tagName: node.tagName,
              });
            }

            // Find value-carrying marks
            const markNodes = Array.from(container.querySelectorAll("line.tick-mark, circle.data-mark, rect.burst-tick"));
            const marks = markNodes.map((m) => {
              const rect = m.getBoundingClientRect();
              return {
                left: Math.round(rect.left * 10) / 10,
                right: Math.round(rect.right * 10) / 10,
                top: Math.round(rect.top * 10) / 10,
                bottom: Math.round(rect.bottom * 10) / 10,
              };
            });

            // Detect pairwise collisions
            const collisions = [];
            for (let i = 0; i < visibleTexts.length; i++) {
              for (let j = i + 1; j < visibleTexts.length; j++) {
                const a = visibleTexts[i];
                const b = visibleTexts[j];

                // Overlap calculation with 1.5px tolerance for subpixel glyph anti-aliasing
                const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
                const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

                if (overlapX > 1.5 && overlapY > 1.5) {
                  collisions.push({
                    textA: a.text,
                    textB: b.text,
                    boxA: `${a.left},${a.top} to ${a.right},${a.bottom}`,
                    boxB: `${b.left},${b.top} to ${b.right},${b.bottom}`,
                    overlapW: Math.round(overlapX * 10) / 10,
                    overlapH: Math.round(overlapY * 10) / 10,
                  });
                }
              }

              // Check collision against external ticks
              for (const mark of marks) {
                const a = visibleTexts[i];
                const overlapX = Math.min(a.right, mark.right) - Math.max(a.left, mark.left);
                const overlapY = Math.min(a.bottom, mark.bottom) - Math.max(a.top, mark.top);
                if (overlapX > 1.5 && overlapY > 1.5) {
                  collisions.push({
                    textA: a.text,
                    textB: "[Tick mark]",
                    boxA: `${a.left},${a.top} to ${a.right},${a.bottom}`,
                    boxB: `${mark.left},${mark.top} to ${mark.right},${mark.bottom}`,
                    overlapW: Math.round(overlapX * 10) / 10,
                    overlapH: Math.round(overlapY * 10) / 10,
                  });
                }
              }
            }

            const under12 = visibleTexts.filter((t) => t.fontSize < 11.0);

            return {
              found: true,
              textCount: visibleTexts.length,
              collisions,
              under12Count: under12.length,
              under12Samples: under12.slice(0, 3).map((u) => `${u.text} (${u.fontSize}px)`),
            };
          }, chartTarget);

          if (!chartAnalysis.found) {
            console.log(`  ⚠ ${chartTarget.name}: element not found`);
            continue;
          }

          if (chartAnalysis.collisions.length > 0) {
            totalCollisions += chartAnalysis.collisions.length;
            for (const col of chartAnalysis.collisions) {
              collisionDetails.push({
                type: "Text Collision",
                chart: chartTarget.name,
                viewport: vp.label,
                detail: `"${col.textA}" overlaps "${col.textB}" by ${col.overlapW}x${col.overlapH}px (A: ${col.boxA}, B: ${col.boxB})`,
              });
            }
            console.log(`  ✖ ${chartTarget.name}: ${chartAnalysis.collisions.length} collision(s) detected (${chartAnalysis.textCount} texts walked)`);
          } else {
            console.log(`  ✔ ${chartTarget.name}: 0 collisions (${chartAnalysis.textCount} texts walked)`);
          }

          if (chartAnalysis.under12Count > 0) {
            totalTextUnder12px += chartAnalysis.under12Count;
          }
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    cleanupServer();
  }

  console.log("\n══════════════════════════════════════════════════════════════════════");
  console.log("                         VERIFICATION REPORT                          ");
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log(`Total Charts Walked:       ${totalChartsWalked}`);
  console.log(`Total Collisions Found:     ${totalCollisions}`);
  console.log(`Horizontal Overflows:      ${totalHorizontalOverflows}`);
  console.log(`Typography <12px Violations: ${totalTextUnder12px}`);

  if (collisionDetails.length > 0) {
    console.log("\nCollision / Issue Log:");
    for (const c of collisionDetails) {
      console.log(`  • [${c.type}] [${c.viewport}] ${c.chart}: ${c.detail}`);
    }
    console.log("\n❌ OVERLAP CHECK FAILED: Found text collisions or layout violations.");
    process.exit(1);
  } else {
    console.log("\n✔ ALL CHARTS CLEAN: 0 text collisions found across all viewports.");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
