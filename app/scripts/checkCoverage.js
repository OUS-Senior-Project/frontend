#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');
const finalPath = path.join(root, 'coverage', 'coverage-final.json');

const targetRaw = process.env.COVERAGE_TARGET;
const target = Number(targetRaw ?? 99);
if (!Number.isFinite(target)) {
  console.error('Invalid COVERAGE_TARGET:', targetRaw);
  process.exit(1);
}

const formatPct = (value) => `${value.toFixed(2)}%`;

const green = process.env.GREEN_COLOR || '';
const reset = process.env.RESET_COLOR || '';

let linesPct = null;
let source = null;

if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const pct = summary?.total?.lines?.pct;
  if (typeof pct !== 'number') {
    console.error('Coverage summary is missing total.lines.pct.');
    process.exit(1);
  }
  linesPct = pct;
  source = 'coverage-summary.json';
} else if (fs.existsSync(finalPath)) {
  const coverage = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
  let totalLines = 0;
  let coveredLines = 0;

  for (const entry of Object.values(coverage)) {
    if (!entry || typeof entry !== 'object') continue;
    const lines = entry.l || {};
    for (const hits of Object.values(lines)) {
      totalLines += 1;
      if (hits > 0) coveredLines += 1;
    }
  }

  linesPct = totalLines === 0 ? 100 : (coveredLines / totalLines) * 100;
  source = 'coverage-final.json';
} else {
  console.error('Coverage data not found. Expected coverage-summary.json or coverage-final.json.');
  process.exit(1);
}

if (linesPct < target) {
  console.error(
    `Coverage below target: ${formatPct(linesPct)} < ${target}% (from ${source}).`
  );
  process.exit(1);
}

console.log(
  `${green}Coverage check passed:${reset} ${formatPct(linesPct)} >= ${target}% (from ${source}).`
);
