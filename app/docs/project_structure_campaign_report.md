# Project Structure Campaign Report

Date: 2026-02-22  
Branch: `campaign/frontend-structure-20260222`  
Area: `app/src`

## Summary

This campaign improved navigation and module boundaries for dashboard orchestration without intended behavior changes. It also removed evidence-backed dead code and preserved Next.js App Router conventions.

## What Changed

### 1) Stable public API entrypoints added

Added scoped `index.ts` entrypoints to reduce concrete file-coupling from consumers:

- `src/features/datasets/api/index.ts`
- `src/features/forecasts/api/index.ts`
- `src/features/majors/api/index.ts`
- `src/features/migration/api/index.ts`
- `src/features/overview/api/index.ts`
- `src/features/submissions/api/index.ts`
- `src/features/dashboard/hooks/index.ts`
- `src/shared/hooks/index.ts`

Applied these in runtime paths:

- `src/features/dashboard/hooks/useDashboardMetricsModel.ts`
- `src/app/(dashboard)/page.tsx`
- `src/shared/ui/sidebar/provider.tsx`
- `src/shared/ui/toaster.tsx`

### 2) Dead/legacy code purged (safe, evidence-backed)

Removed files:

- `src/shared/ui/use-mobile.tsx`
- `src/shared/ui/use-toast.ts`

Removed unused exports:

- `calculateFiveYearGrowthRate` from `src/features/metrics/utils/metrics-summary-utils.ts`
- `SubmissionCreateResponse` from `src/lib/api/types.ts`

Adjusted affected tests/mocks to use canonical/stable entrypoints and removed tests tied only to the deleted dead export.

## Final Verification (Step 6)

Executed after all changes:

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm test` ✅ (`41` suites, `276` tests)
- `npm run build` ✅

## Totals

- Files removed: `2`
- Unused exports removed: `2`
- Unused dependencies removed: `0` (none removed this campaign)

## Before/After Module Map Summary

### Features (`src/features/*` file counts)

Before:
- `dashboard 10`, `datasets 1`, `forecasts 1`, `majors 1`, `migration 1`, `overview 1`, `submissions 1`

After:
- `dashboard 11`, `datasets 2`, `forecasts 2`, `majors 2`, `migration 2`, `overview 2`, `submissions 2`

Interpretation:
- Increases are intentional and from scoped `api/index.ts` and `hooks/index.ts` entrypoints.

### Shared (`src/shared/*` file counts)

Before:
- `hooks 5`, `ui 127`

After:
- `hooks 6`, `ui 125`

Interpretation:
- `shared/hooks` gained a canonical public API index.
- `shared/ui` lost two legacy compatibility wrappers.

## Rollback Plan

1. Revert campaign commits on `campaign/frontend-structure-20260222`.
2. If partial rollback is needed, restore removed wrapper files and deleted exports, then switch imports back to concrete module paths.
3. Re-run verification gates (`lint`, `typecheck`, `test`, `build`).
