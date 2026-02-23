# Performance Campaign: OUS Analytics Dashboard

## Scope

This campaign targeted dashboard responsiveness and stability in `app/src/app/(dashboard)/page.tsx` and supporting feature modules, without changing backend contracts or user-visible state semantics.

## Principles Applied

- Optimize only evidence-backed hotspots.
- Preserve API shapes and UI correctness.
- Prefer fewer renders and fewer redundant requests over micro-optimizations.
- Keep polling deterministic and cancellable.
- Improve cache correctness first, then reuse.

## What Was Optimized

### 1) Request Efficiency and Dedupe

- Removed overview reloads caused by date-only UI state changes in `useDashboardMetricsModel`.
- Kept request dedupe keys stable for panel resources and dataset status.
- Added tests to lock in no extra overview fetch on date-only changes.

### 2) Polling Correctness and Cadence

- Replaced interval-plus-overlap-guard polling with a single timeout-driven loop keyed by processing dataset id.
- Stopped poll-loop restarts on status string churn for the same dataset id.
- Preserved abort behavior and timeout guardrails.
- Added tests that assert interval cadence when status changes.

### 3) Render Stability

- `DashboardTabs` now mounts only the active panel.
- Memoized panel components and heavy chart components.
- Memoized frequently recomputed derivations in major chart and migration/chart components.
- Stabilized retry callbacks returned from the dashboard model hook.

### 4) Cache Safety

- Added dataset cache invalidation on known writes:
  - dataset activation,
  - dataset submission creation,
  - bulk submission creation.
- Added/updated service tests for invalidation behavior.

### 5) Dev Instrumentation

- Added lightweight development-only `performance.mark/measure` timings in `useDashboardMetricsModel`:
  - `dashboard:bootstrap`
  - `dashboard:dataset:active:load`
  - `dashboard:panel:overview:load`
  - `dashboard:panel:majors:load`
  - `dashboard:panel:migration:load`
  - `dashboard:panel:forecasts:load`

## Long-Term Guardrails

See `app/docs/performance_checklist.md` for the reusable checklist added in this campaign.
