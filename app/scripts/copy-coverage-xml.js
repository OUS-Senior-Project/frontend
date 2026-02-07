#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'coverage', 'cobertura-coverage.xml');
const dest = path.join(root, 'coverage', 'coverage.xml');

if (!fs.existsSync(src)) {
  console.warn('Cobertura report not found at', src);
  process.exit(0);
}

fs.copyFileSync(src, dest);
console.log('Copied coverage XML to', dest);
