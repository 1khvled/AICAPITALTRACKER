import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const today = new Date('2026-10-18T00:00:00.000Z');
const totalDays = 90;
const startProb = 64.2;
const endProb = 68.4;

const history = [];

for (let i = 0; i < totalDays; i++) {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - (totalDays - 1 - i));
  const dateStr = d.toISOString().split('T')[0];

  const progress = i / (totalDays - 1);
  const wiggle = Math.sin(i * 0.35) * 0.4 + Math.cos(i * 0.18) * 0.3;
  let prob = Math.round((startProb + (endProb - startProb) * Math.pow(progress, 0.9) + wiggle * (1 - Math.abs(progress - 0.5) * 0.5)) * 10) / 10;
  if (i === totalDays - 1) prob = 68.4;
  if (i === totalDays - 2) prob = 68.2;
  if (i === 0) prob = 64.2;

  const score = Math.round((prob * 0.96) * 10) / 10;
  const mertonDD = Math.round((3.10 - progress * 0.26 + Math.cos(i * 0.2) * 0.04) * 100) / 100;
  const altmanZ = Math.round((2.02 - progress * 0.18 + Math.sin(i * 0.25) * 0.03) * 100) / 100;
  const var95 = Math.round((46.5 + progress * 3.1 + Math.sin(i * 0.4) * 0.3) * 10) / 10;
  const delta90 = Math.round((prob - 64.2) * 10) / 10;
  const deltaVsYesterday = i === 0 ? 0 : Math.round((prob - history[i - 1].probability) * 10) / 10;

  history.push({
    dayIndex: i,
    date: dateStr,
    dayLabel: i === totalDays - 1 ? 'Current' : `${totalDays - 1 - i}d ago`,
    probability: prob,
    compositeScore: score,
    mertonDD: i === totalDays - 1 ? 2.84 : mertonDD,
    altmanZ: i === totalDays - 1 ? 1.84 : altmanZ,
    var95: i === totalDays - 1 ? 49.6 : var95,
    deltaVs90d: delta90 >= 0 ? `+${delta90.toFixed(1)}%` : `${delta90.toFixed(1)}%`,
    deltaVsYesterday: deltaVsYesterday >= 0 ? `+${deltaVsYesterday.toFixed(1)}%` : `${deltaVsYesterday.toFixed(1)}%`,
    cdsOracleBps: Math.round(155 + progress * 32 + wiggle * 5),
  });
}

const outputPath = path.join(projectRoot, 'src', 'data', 'trajectory-history.json');
fs.writeFileSync(outputPath, JSON.stringify(history, null, 2), 'utf-8');
console.log(`Generated ${history.length} records in ${outputPath}`);
