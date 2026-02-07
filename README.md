# OUS Analytics (frontend)

OUS Analytics is a Next.js + TypeScript dashboard for undergraduate student insights. The UI currently uses synthetic data generated in `app/lib/analytics-data.ts` and a local CSV upload control that only updates client state (no backend API wiring yet).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS + PostCSS/Autoprefixer
- Radix UI primitives, lucide-react icons
- Recharts for charts
- Jest + React Testing Library

## Project structure

- `app/` – Next.js project root
  - `src/app/` – App Router (`layout.tsx`, `page.tsx`, global styles)
  - `components/` – analytics + UI components
  - `hooks/` – shared hooks
  - `lib/` – data generators + utilities
  - `styles/` – global styles
  - `test/` – Jest/RTL tests + mocks
  - `scripts/` – coverage helpers
  - `docs/` – coverage ledger
- `.github/workflows/` – lint/test/coverage CI

## Prerequisites

- Node 18.x, npm

## Setup

```bash
cd app
npm install
```

## Running locally

- Dev server: `cd app && npm run dev`
- Production build + start: `cd app && npm run build && npm start`
- From repo root: `./runFrontend.sh` (builds and starts)

Open http://localhost:3000.

## How OUS Analytics works

1. Data: Student data is generated in `app/lib/analytics-data.ts`.
2. Upload: The CSV upload control updates local state and displays the file name.
3. UI: Overview metrics, charts, cohort tables, migration charts, and forecasts render from the generated data.

## Scripts (from `app/`)

- `npm run dev` – Next.js dev server
- `npm run build` – production build
- `npm start` – start production server
- `npm run lint` – ESLint
- `npm run format` – Prettier check
- `npm run test` – Jest (unit/integration)
- `npm run test:coverage` – Jest with coverage enabled
- `npm run test:ci` – CI-style Jest run (coverage + `--runInBand`)
- `npm run typecheck` – TypeScript typecheck (`tsc --noEmit`)

## Testing and coverage

- Run tests: `cd app && npm test`
- Run tests with coverage: `cd app && npm run test:coverage`
- CI-style run: `cd app && npm run test:ci`
- Coverage output: `app/coverage/` (`coverage-summary.json`, `coverage-final.json`, `lcov-report/`)
- Coverage guardrail: `node app/scripts/checkCoverage.js` (default `COVERAGE_TARGET=99`)
- Coverage ledger: `node app/scripts/generate-coverage-ledger.mjs` (writes `app/docs/COVERAGE_LEDGER.md`)

## CI

- `frontend-lint.yml` – lint + format checks
- `frontend-test.yml` – tests + build
- `frontend-coverage.yml` – coverage gate + artifacts
