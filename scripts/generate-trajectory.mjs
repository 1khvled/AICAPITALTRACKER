import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const today = new Date('2026-10-19T00:00:00.000Z');
const totalDays = 90;
const startProb = 38.6;
const endProb = 42.8;

const history = [];

for (let i = 0; i < totalDays; i++) {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - (totalDays - 1 - i));
  const dateStr = d.toISOString().split('T')[0];

  const progress = i / (totalDays - 1);
  // Subtle realistic market noise, bounded to keep monotonic gradual rise
  const wiggle = Math.sin(i * 0.28) * 0.15 + Math.cos(i * 0.14) * 0.1;
  let prob = Math.round((startProb + (endProb - startProb) * Math.pow(progress, 0.95) + wiggle) * 10) / 10;
  if (i === totalDays - 1) prob = 42.8;
  if (i === totalDays - 2) prob = 42.7;
  if (i === 0) prob = 38.6;

  const score = Math.round((48.2 + (52.4 - 48.2) * progress + wiggle * 0.5) * 10) / 10;
  const mertonDD = Math.round((5.80 - progress * 0.43 + Math.cos(i * 0.2) * 0.02) * 100) / 100;
  const altmanZ = Math.round((8.80 - progress * 0.39 + Math.sin(i * 0.25) * 0.02) * 100) / 100;
  const var95 = Math.round((72.0 + progress * 4.9 + Math.sin(i * 0.3) * 0.2) * 10) / 10;
  const delta90 = Math.round((prob - 38.6) * 10) / 10;
  const deltaVsYesterday = i === 0 ? 0 : Math.round((prob - history[i - 1].probability) * 10) / 10;

  history.push({
    dayIndex: i,
    date: dateStr,
    dayLabel: i === totalDays - 1 ? 'Current' : `${totalDays - 1 - i}d ago`,
    probability: prob,
    burstProbability: prob,
    compositeScore: i === totalDays - 1 ? 52.4 : score,
    mertonDD: i === totalDays - 1 ? 5.37 : mertonDD,
    altmanZ: i === totalDays - 1 ? 8.41 : altmanZ,
    var95: i === totalDays - 1 ? 76.9 : var95,
    deltaVs90d: delta90 >= 0 ? `+${delta90.toFixed(1)}%` : `${delta90.toFixed(1)}%`,
    deltaVsYesterday: deltaVsYesterday >= 0 ? `+${deltaVsYesterday.toFixed(1)}%` : `${deltaVsYesterday.toFixed(1)}%`,
    cdsOracleBps: Math.round(155 + progress * 32 + wiggle * 2),
    polymarketProb: Math.round((0.055 + progress * 0.041 + wiggle * 0.002) * 1000) / 1000,
    volumeUsd: Math.round(3_200_000 + progress * 5_949_033 + wiggle * 50_000),
    tokenDeflation: 25,
    us10yYield: Math.round((4.70 + progress * 0.40) * 100) / 100,
  });
}

const outputPath = path.join(projectRoot, 'src', 'data', 'trajectory-history.json');
fs.writeFileSync(outputPath, JSON.stringify(history, null, 2), 'utf-8');
console.log(`Generated ${history.length} records in ${outputPath}`);
