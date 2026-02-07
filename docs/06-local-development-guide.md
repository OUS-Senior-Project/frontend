# 06 Local Development Guide

## Prerequisites
- Node.js 18+ recommended
- npm

## Install
From repo root:
```bash
cd app
npm install
```

## Run locally
Option 1:
```bash
cd app
npm run dev
```

Option 2:
```bash
./runFrontend.sh
```

App URL: `http://localhost:3000`

## Useful commands
From `app/`:
- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run build`

From repo root:
- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run typecheck`

## Required env vars
- None required for frontend runtime.

## Known limitations (no backend integration yet)
- Upload action does not parse, persist, or send file contents.
- Dashboard data is mock fixture-driven.
- No persisted datasets or historical backend comparisons.
- No backend export flow.
