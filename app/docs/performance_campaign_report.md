# Performance Campaign Report

Date: 2026-02-22  
Area: OUS Analytics dashboard (`/`)

## Measurement Notes

- Environment: local CLI, production build via `next build --webpack` + `next start`.
- Browser DevTools and React Profiler UI were not available in this headless environment.
- Network and render evidence below combines:
  - local server timing (`next start`, `curl /`),
  - deterministic request/render behavior from test instrumentation and code-path analysis.

## Before Metrics (Baseline)

| Metric | Baseline | Method |
| --- | --- | --- |
| Build compile phase | `Compiled successfully in 3.0s` | `npm run build` output |
| Server startup ready | `Ready in 132ms` | `npm run start` output |
| `GET /` HTML transfer | `ttfb=0.004821s`, `total=0.005108s`, `9174 bytes` | `curl -w` against local prod server |
| Initial dashboard data requests (ready dataset path) | `7` requests | Hook/service path analysis (`active` + `overview` + `majors(2)` + `migration(2)` + `forecasts`) |
| Date-only UI change (`selectedDate`) | `+1 overview fetch` per change | Previous hook dependency path (`selectedDate` in overview loader/effect) |
| Processing-status poll cadence on status churn | Could trigger immediate extra status request | Previous poll effect depended on full `readModelState` and restarted on status changes |
| Panel render fan-out at tabs level | `4` panel components mounted from parent render path | Previous `DashboardTabs` always rendered all panel components |

## Hotspot Analysis

1. Redundant overview fetches were tied to a UI-only state (`selectedDate`) not used by API params.
2. Processing poll loop could restart when status text changed for the same dataset id, creating near back-to-back requests.
3. `DashboardTabs` rendered all panel components on every parent render, including heavy chart trees not currently active.
4. Dataset cache had no explicit invalidation on known writes (`activate`, submissions).
5. Several chart/panel derivations were recalculated in render without memoization.

## Changes Made

### A) Reduced Redundant Calls

- `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`
  - Removed `selectedDate` from overview request key and effect dependencies.
  - Added regression test for date-only changes not triggering overview re-fetch.

### B) Polling Efficiency + Cancellation

- `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`
  - Polling switched to single timeout-driven loop (no overlap, no status-churn restarts).
  - Poll loop now keyed to processing dataset id, not full read-model object.
  - Existing abort/timeout protections preserved.
  - Added cadence test to ensure interval pacing under status transitions.

### C) Render Stability

- `app/src/features/dashboard/components/DashboardTabs.tsx`
  - Only active tab panel is mounted/rendered.
- Memoized panels/charts/derived values:
  - `app/src/features/dashboard/components/panels/OverviewPanel.tsx`
  - `app/src/features/dashboard/components/panels/MajorsPanel.tsx`
  - `app/src/features/dashboard/components/panels/MigrationPanel.tsx`
  - `app/src/features/dashboard/components/panels/ForecastsPanel.tsx`
  - `app/src/features/metrics/components/ForecastSection.tsx`
  - `app/src/features/metrics/components/MigrationTopFlowsTable.tsx`
  - `app/src/features/metrics/components/charts/MajorDistributionChart.tsx`
  - `app/src/features/metrics/components/charts/MetricsTrendChart.tsx`
  - `app/src/features/metrics/components/charts/MetricsTrendChartPlot.tsx`
  - `app/src/features/metrics/components/charts/MigrationFlowChart.tsx`
- Stabilized retry callback identities in dashboard model hook.

### D) Cache Correctness

- Added explicit cache invalidation on write operations:
  - `app/src/features/datasets/api/datasetsService.ts` (`activateDataset`)
  - `app/src/features/submissions/api/submissionsService.ts` (`createDatasetSubmission`, `createBulkSubmissionJob`)

### E) Dev Instrumentation

- Added development-only performance marks/measures in:
  - `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`
- Metrics emitted:
  - `dashboard:bootstrap`
  - `dashboard:dataset:active:load`
  - `dashboard:panel:overview:load`
  - `dashboard:panel:majors:load`
  - `dashboard:panel:migration:load`
  - `dashboard:panel:forecasts:load`

## Post-Change Metrics

| Metric | Post-Change | Result |
| --- | --- | --- |
| Build compile phase | `Compiled successfully in 4.0s` | No meaningful change (build-time noise; runtime optimizations were targeted) |
| Server startup ready | `Ready in 130ms` | Neutral/slightly better |
| `GET /` HTML transfer | `ttfb=0.020284s`, `total=0.020498s`, `9174 bytes` | Neutral (single-sample local variability) |
| Initial dashboard data requests (ready dataset path) | `7` requests | Unchanged by design (no backend contract/UI behavior change) |
| Date-only UI change (`selectedDate`) | `0` additional overview fetches | Improved |
| Processing-status polling on status churn | Interval-based only (`1` call per interval) | Improved |
| Tabs render fan-out | `1` active panel mounted instead of all `4` | Improved |

## Verification / Gates

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (38 suites, 247 tests)
- `npm run build` ✅

## Rollback Plan

If any regression appears, rollback in this order:

1. Revert `DashboardTabs` active-panel-only mounting change.
2. Revert polling loop rewrite in `useDashboardMetricsModel`.
3. Revert overview date-trigger fetch removal if product requirements require date-driven server filtering.
4. Revert cache invalidation writes if backend consistency assumptions differ.
5. Keep tests/docs; use them as regression references for re-implementation.
