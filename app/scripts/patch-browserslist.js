#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'next',
  'dist',
  'compiled',
  'browserslist',
  'index.js'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
const pattern =
  /\d+<\(new Date\)\.setMonth\(\(new Date\)\.getMonth\(\)-2\)&&console\.warn\("\[baseline-browser-mapping\][^;]*?"\);/;

if (!pattern.test(source)) {
  process.exit(0);
}

const patched = source.replace(pattern, '0;');
fs.writeFileSync(target, patched, 'utf8');
