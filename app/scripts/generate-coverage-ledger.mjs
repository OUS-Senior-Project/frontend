import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  console.error('Coverage summary not found at', summaryPath);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const coverageMap = new Map();
for (const [key, value] of Object.entries(summary)) {
  if (key === 'total') continue;
  coverageMap.set(path.resolve(key), value);
}

const runtimeDirs = ['components', 'hooks', 'lib', 'src'];

const isIncludedFile = (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return false;
  if (filePath.endsWith('.d.ts')) return false;
  if (filePath.includes('.stories.')) return false;
  if (filePath.includes('.config.')) return false;
  return true;
};

const walk = (dir, fileList = []) => {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, fileList);
    } else if (entry.isFile() && isIncludedFile(fullPath)) {
      fileList.push(path.resolve(fullPath));
    }
  }
  return fileList;
};

const runtimeFiles = runtimeDirs
  .map((dir) => path.join(root, dir))
  .flatMap((dir) => walk(dir))
  .sort((a, b) => a.localeCompare(b));

const targetRaw = Number(process.env.COVERAGE_TARGET ?? 99);
const target = Number.isFinite(targetRaw) ? targetRaw : 99;

const areaForPath = (relPath) => {
  if (relPath.startsWith('components/analytics/')) return 'analytics';
  if (relPath.startsWith('components/ui/')) return 'ui';
  if (relPath.startsWith('components/')) return 'components';
  if (relPath.startsWith('hooks/')) return 'hooks';
  if (relPath.startsWith('lib/')) return 'lib';
  if (relPath.startsWith('src/app/')) return 'app';
  if (relPath.startsWith('src/')) return 'src';
  return 'misc';
};

const abbr = {
  statements: 'S',
  branches: 'B',
  functions: 'F',
  lines: 'L',
};

const rgAvailable = (() => {
  const result = spawnSync('rg', ['--version'], { encoding: 'utf8' });
  return result.status === 0;
})();

const findTestsForFile = (relPath) => {
  const testsRoot = path.join(root, 'test');
  if (!rgAvailable || !fs.existsSync(testsRoot)) return [];

  const baseName = path.basename(relPath, path.extname(relPath));
  const relNoExt = relPath.replace(/\.[^.]+$/, '');
  const results = new Set();

  const addResults = (cmd, args) => {
    const res = spawnSync(cmd, args, { encoding: 'utf8' });
    if (res.status !== 0 || !res.stdout) return;
    res.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((file) => results.add(path.relative(root, file)));
  };

  addResults('rg', ['--files', '-g', `*${baseName}*.test.*`, testsRoot]);
  addResults('rg', ['-l', `@/${relNoExt}`, testsRoot]);

  return Array.from(results).slice(0, 3);
};

const rows = runtimeFiles.map((file) => {
  const relPath = path.relative(root, file).replace(/\\/g, '/');
  const entry = coverageMap.get(file);
  let status = 'not instrumented';

  if (entry) {
    const metrics = ['statements', 'branches', 'functions', 'lines'];
    const below = metrics
      .map((metric) => ({
        metric,
        pct: typeof entry[metric]?.pct === 'number' ? entry[metric].pct : 0,
      }))
      .filter((metric) => metric.pct < target);

    if (below.length === 0) {
      status = `covered (>=${target}%)`;
    } else {
      status = `needs tests (${below
        .map((metric) => `${abbr[metric.metric]}:${metric.pct}`)
        .join(' ')})`;
    }
  }

  const tests = findTestsForFile(relPath);
  return {
    relPath,
    area: areaForPath(relPath),
    status,
    tests: tests.length ? tests.join(', ') : '-',
  };
});

const outputDir = path.join(root, 'docs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const lines = [];
lines.push('# Coverage Ledger');
lines.push('');
lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);
lines.push('');
lines.push('| Path | Area | Status | Tests |');
lines.push('| --- | --- | --- | --- |');

for (const row of rows) {
  lines.push(
    `| ${row.relPath} | ${row.area} | ${row.status} | ${row.tests} |`
  );
}

const outputPath = path.join(outputDir, 'COVERAGE_LEDGER.md');
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');

console.log('Wrote coverage ledger to', outputPath);
