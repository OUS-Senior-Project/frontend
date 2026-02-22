# Code Quality Campaign Report

Date: 2026-02-22  
Area: Frontend maintainability (`app/src`)

## Baseline

All baseline gates were green before changes:

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅
- `npm run build` ✅

## Debt Inventory (Step 0)

### Hotspots found

1. TODO/FIXME debt
- `app/src/lib/api/normalize.ts` had an explicit TODO around semester coercion.

2. Duplicated service logic
- Pagination normalization and warning logic duplicated in:
  - `app/src/features/datasets/api/datasetsService.ts`
  - `app/src/features/submissions/api/submissionsService.ts`

3. Inconsistent query guardrail usage
- Some services used `filterQueryParams`, others passed unfiltered query objects.

4. Weak runtime type-safety at API boundaries
- Normalizing services trusted generic response types without runtime shape checks.

5. Inconsistent error-debug surfacing
- `requestId` was preserved in `UIError` but not consistently surfaced in user-facing messages.

6. Dashboard orchestrator readability
- Repeated panel loading/error-handling branches in `useDashboardMetricsModel`.
- Read-model transition helpers co-located in the large orchestrator hook.

## Changes Implemented

### A) Shared API concerns consolidated

Added `app/src/lib/api/service-helpers.ts` and refactored feature services to use it.

- Shared API path creation: `toApiPath(...)`
- Shared query allowlisting: `buildGuardedQuery(...)`
- Shared pagination normalization: `buildPaginationQuery(...)`
- Shared dataset cache options: `withDatasetCache(...)`
- Shared path segment encoding: `encodePathSegment(...)`

Updated services:

- `app/src/features/datasets/api/datasetsService.ts`
- `app/src/features/submissions/api/submissionsService.ts`
- `app/src/features/overview/api/overviewService.ts`
- `app/src/features/majors/api/majorsService.ts`
- `app/src/features/migration/api/migrationService.ts`
- `app/src/features/forecasts/api/forecastsService.ts`

### B) Runtime response validators added

`app/src/lib/api/normalize.ts` now exports lightweight guards:

- `isRawDatasetOverviewResponse(...)`
- `isRawDatasetForecastResponse(...)`

Applied in:

- `app/src/features/overview/api/overviewService.ts`
- `app/src/features/forecasts/api/forecastsService.ts`

Malformed payloads now throw `INVALID_RESPONSE_SHAPE` (non-retryable), improving correctness and debugging.

### C) Deterministic semester/date helpers introduced

Added `app/src/lib/format/semester.ts` and replaced scattered semester logic.

Integrated in:

- `app/src/lib/api/normalize.ts`
- `app/src/features/metrics/selectors/trend-selectors.ts`
- `app/src/features/metrics/selectors/snapshot-selectors.ts`

The previous semester normalization TODO was removed and replaced with documented helper behavior.

### D) Error messaging consistency improved

Added `formatUIErrorMessage(...)` in `app/src/lib/api/errors.ts`.

Applied in dashboard UI surfaces:

- `app/src/app/(dashboard)/page.tsx`
- `app/src/features/dashboard/components/DashboardNoDatasetState.tsx`
- `app/src/features/dashboard/components/panels/OverviewPanel.tsx`
- `app/src/features/dashboard/components/panels/MajorsPanel.tsx`
- `app/src/features/dashboard/components/panels/MigrationPanel.tsx`
- `app/src/features/dashboard/components/panels/ForecastsPanel.tsx`

Request IDs are now consistently visible when available.

### E) Dashboard orchestration readability tightened

- Added `app/src/features/dashboard/hooks/dashboardReadModel.ts` for read-model state and transition helpers.
- Refactored `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`:
  - centralized panel-load behavior via one shared loader pipeline,
  - moved read-model transition checks into helper functions,
  - kept timer/polling cleanup behavior unchanged,
  - kept hook public API stable.

### F) Component boundary simplification

- `app/src/features/dashboard/components/DashboardTabs.tsx` now accepts a single `model` prop instead of a large prop list.
- `app/src/app/(dashboard)/page.tsx` now passes `model={dashboard}`.

## Test and Quality Updates

### New/updated tests

- Added:
  - `app/test/lib/semester-format.test.ts`
- Updated:
  - `app/test/lib/api-normalize.test.ts`
  - `app/test/lib/api-boundary.test.ts`
  - `app/test/lib/service-modules.test.ts`
  - `app/test/components/dashboard/dashboard-tabs.test.tsx`

### Final verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (`39` suites, `260` tests)
- `npm run build` ✅

## Behavior / Risk Assessment

- Product behavior intentionally unchanged for normal flows.
- API contracts unchanged.
- Improvements are internal quality, consistency, and guardrails.
- Main risk surface is stricter malformed-response rejection for overview/forecast endpoints; covered with service tests.
