# OUS Analytics Frontend

Internal administrative analytics dashboard UI for the Howard University OUS office.

## Documentation Index

- Monolithic reference: this `README.md`
- Split references:
  - `docs/README.md`
  - `docs/01-routing-and-structure.md`
  - `docs/02-user-flows-current-vs-planned.md`
  - `docs/03-frontend-data-and-state-model.md`
  - `docs/04-backend-integration-surface-planned.md`
  - `docs/05-configuration-and-environment.md`
  - `docs/06-local-development-guide.md`
  - `docs/07-known-gaps-and-next-steps.md`

## Product Status

### Current state (implemented)
- Next.js App Router frontend wired to FastAPI backend endpoints under `/api/v1`.
- Runtime networking is implemented via `app/src/lib/api/client.ts` using `NEXT_PUBLIC_API_BASE_URL`.
- Dashboard tabs (Overview, Majors, Migration, Forecasts) load real backend data with loading/error/empty states.
- Upload flow posts multipart file payloads to backend and polls submission status until terminal state.

### Current priorities
- Expand dataset management UX beyond the active dataset workflow.
- Implement export-focused routes/workflows under `features/exports`.
- Continue improving async UX and edge-case handling around long-running ingestion.

## 1) Routing And Structure Map

## App entry points
- `app/src/app/layout.tsx`: root layout, global metadata, global CSS, Vercel Analytics component.
- `app/src/app/(dashboard)/page.tsx`: main dashboard page rendered at `/`.
- `app/src/app/(dashboard)/layout.tsx`: passthrough layout for dashboard route group.

`main.tsx` and `App.tsx` do not exist in this repo. This project uses Next.js App Router, not a standalone React Router SPA entrypoint.

## Routing approach
- Framework routing: Next.js App Router (filesystem routing).
- Route groups: `(dashboard)`, `(data)`, `(exports)`.
- `(data)` and `(exports)` currently contain README placeholders only and do not create active routes.

## Route index (current)
- `/` -> Dashboard view from `app/src/app/(dashboard)/page.tsx`
  - Includes tabs: Overview, Majors, Migration, Forecasts.
  - Includes upload control inside Overview tab.
- No standalone upload route is wired.
- No standalone exports route is wired.

## Folder structure (current)
- `app/src/app/`: routes, layouts, global styles.
- `app/src/features/dashboard/`: dashboard container components and the main view model hook.
- `app/src/features/metrics/`: metric types, mock fixture generation, selectors, charts/tables.
- `app/src/features/upload/`: upload button and upload status banner components.
- `app/src/features/filters/`: date and semester filter UI components.
- `app/src/features/exports/`: currently empty placeholders.
- `app/src/shared/ui/`: reusable UI primitives (Radix/Tailwind wrappers).
- `app/src/shared/hooks/`: shared hooks (toast, mobile helpers).
- `app/src/lib/`: shared API client, error normalization, and type contracts.

## Data flow and state ownership
- Backend service modules:
  - `app/src/features/*/api/*.ts`
  - `app/src/lib/api/client.ts`
- Stateful UI orchestration:
  - `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`
- Local UI state includes selected date, modal state, migration semester, and forecast horizon controls.
- Domain/derivation logic remains frontend-local:
  - `app/src/features/metrics/selectors/*`
  - `app/src/features/metrics/utils/metrics-summary-utils.ts`

## 2) User Flow Documentation

### A. Current implemented user flow

1. App load
- UI state: Dashboard page renders at `/` with default tab `Overview`.
- Components: `DashboardPage`, `DashboardHeader`, `DashboardTabs`.
- Data source: generated fixture data via `getMockAnalyticsRepository()`.

2. Data hydration for dashboard widgets
- UI state: cards/charts/tables populate immediately.
- Components: panels under `app/src/features/dashboard/components/panels/*`, metric chart/table components.
- Data source: in-memory fixtures + selector transforms in `app/src/features/metrics/selectors/*`.

3. Date filter interaction (Overview)
- UI state: changing date updates displayed snapshot metrics.
- Components: `DateFilterButton`, `useDashboardMetricsModel`.
- Data source: local state (`selectedDate`) + `selectSnapshotForDate` fallback logic.

4. Upload interaction (Overview)
- UI state: selecting a `.csv` file shows `Successfully loaded: <filename>`.
- Components: `UploadDatasetButton`, `UploadStatusPanel`, `useDashboardMetricsModel.handleDatasetUpload`.
- Data source: local file input event only; no parsing, no API call, no persistence.

5. Migration semester filter
- UI state: migration chart and top flows table update for selected semester.
- Components: `SemesterFilterSelect`, `MigrationFlowChart`, `MigrationTopFlowsTable`.
- Data source: mock migration fixture data filtered in-memory.

6. Forecasts view
- UI state: forecast cards/charts shown from derived trend data.
- Components: `ForecastsPanel`, `ForecastSection`.
- Data source: selector-derived projections (`selectForecastSeries`), not ML service/back-end forecasts.

7. Empty/placeholder states
- Implemented: migration chart empty state component exists (`MigrationFlowEmptyState`) and renders only if filtered data is empty.
- Route placeholders: `(data)/upload` and `(exports)` route groups are documented placeholders only.

### B. PLANNED user flow (not implemented)
- Upload `.xlsx` file to backend ingestion endpoint.
- Backend validates/cleans/transforms and persists dataset.
- Frontend fetches persisted summaries and detailed metrics.
- Multi-dataset management (select/switch datasets, dataset metadata).
- Historical comparisons across uploaded datasets and time windows.
- Export workflows backed by server-generated files.

## 3) Frontend Data And State Model (Current)

## Core state shape (local React state)
From `useDashboardMetricsModel`:
- `selectedDate: Date`
- `breakdownOpen: boolean`
- `migrationSemester: string | undefined`
- `uploadedDatasetName: string | null`

## Mock schemas
Defined in `app/src/features/metrics/types.ts`:
- `AnalyticsRecord`: `{ year, semester, major, school, studentType, count }`
- `MigrationRecord`: `{ fromMajor, toMajor, semester, count }`
- `MajorCohortRecord`: `{ major, cohort, avgGPA, avgCredits, studentCount }`
- Derived view models: `TrendPoint`, `ForecastPoint`, `SnapshotTotals`

## Temporary assumptions baked into UI
- Dashboard has immediate synchronous access to full datasets (no loading states from network).
- Forecast data is computed from recent trend points in selectors, not fetched.
- `international` in snapshot totals is a fixed 12% calculation (`selectSnapshotTotals`).
- Upload success is inferred from local file selection only.

## State that must be replaced during backend integration
- `getMockAnalyticsRepository()` and all fixture generators.
- Any selector input currently sourced directly from in-memory arrays.
- `uploadedDatasetName` as an upload success signal (must be replaced by backend response status).

## Components currently assuming synchronous data
- `DashboardPage` and all tab panels.
- Metrics chart/table components under `app/src/features/metrics/components/*`.
- No async loading/error orchestration for API fetch lifecycles yet.

## 4) Backend Integration Surface (PLANNED)

No real endpoints are implemented in this repo today. The following is a UI contract surface inferred from current component needs.

## Likely API integration locations
- Feature-level services/repositories under:
  - `app/src/features/metrics/` (replace mock repository)
  - `app/src/features/upload/` (upload + status)
  - `app/src/features/exports/` (currently empty placeholder)
- Hook orchestration point:
  - `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`

## Screens requiring backend data
- Overview: snapshot totals, trend series, student type distribution, school distribution.
- Majors: major counts, cohort GPA/credits/student counts.
- Migration: semester options + migration flows.
- Forecasts: historical trend + backend-supported forecasting (if moved server-side).
- Upload status panel: actual ingestion/processing status and dataset identifiers.

## Data shapes the UI already expects
- Analytics records keyed by year/semester/major/school/student type/count.
- Migration records keyed by from-major/to-major/semester/count.
- Cohort-level major metrics keyed by cohort/major with GPA/credits/count.
- Snapshot and trend aggregations consumable as flat arrays for chart components.

## 5) Configuration / Environment Variables

## Current state
- Frontend runtime requires `NEXT_PUBLIC_API_BASE_URL` for backend API requests.
- API calls are routed through `app/src/lib/api/client.ts` and service modules in `app/src/features/*/api`.
- `next.config.mjs` remains focused on Next.js build/runtime behavior.

## Existing env usage (non-runtime app behavior)
- Coverage/build scripts use process env values:
  - `COVERAGE_TARGET`
  - `GREEN_COLOR`
  - `RESET_COLOR`
  - `BROWSERSLIST_IGNORE_OLD_DATA`
  - `BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA`

## Build vs runtime config
- Build/runtime app config: static Next config only (`app/next.config.mjs`).
- Script-time config: env vars consumed by scripts in `app/scripts/*` and helper shell scripts.

## 6) Local Development Guide

## Prerequisites
- Node.js (18+ recommended)
- npm

## Install
From repository root:
```bash
cd app
npm install
```

## Run dev server
Option 1 (inside app):
```bash
cd app
npm run dev
```

Option 2 (repo root helper):
```bash
./runFrontend.sh
```

Then open `http://localhost:3000`.

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
- `NEXT_PUBLIC_API_BASE_URL` (example: `http://localhost:8000`)

## Known limitations
- The UI currently operates around the backend "active dataset" and does not yet provide full dataset browsing/switching workflows.
- Export routes/workflows remain placeholders.
- Forecast and migration controls are intentionally minimal in MVP1.

## 7) Known Gaps / Technical Debt And Next Steps

## Current gaps
- Export workflows are not implemented.
- Dataset management beyond active-dataset reads/activation is still limited in the current UI.
- Some documentation sections still describe the pre-integration architecture and need consolidation.

## Planned next steps
1. Add dataset browsing/version selection UX on top of existing backend dataset endpoints.
2. Implement export workflows and corresponding route-level UI.
3. Add deeper observability for ingestion lifecycle states (long-running jobs and retries).
4. Consolidate docs to remove remaining pre-integration references.
