# Frontend Project Structure Campaign

Date: 2026-02-22  
Branch: `campaign/frontend-structure-20260222`  
Scope: `app/src`

## Step 0: Baseline Gates

Executed baseline commands before making structural changes:

- `git status --porcelain --branch` -> `## campaign/frontend-structure-20260222`
- `npm ci` -> success
- `npm run lint` -> success (`--max-warnings=0`)
- `npm run typecheck` -> success
- `npm test` -> success (`40` suites, `272` tests)
- `npm run build` -> success

Baseline was green, so campaign work proceeded.

## Step 1: Current Module Map

### Routes (`src/app/*`)

- `src/app/layout.tsx`: global shell and metadata.
- `src/app/(dashboard)/layout.tsx`: dashboard route group layout passthrough.
- `src/app/(dashboard)/page.tsx`: dashboard page entrypoint (client), delegates to dashboard feature model + panels.
- `src/app/(data)/upload/README.md`: placeholder docs only (no route implementation).
- `src/app/(exports)/README.md`: placeholder docs only (no route implementation).

### Features (`src/features/*`)

- `dashboard` (`10` files): dashboard shell + major orchestrator hook (`useDashboardMetricsModel.ts`, `862` LOC).
- `metrics` (`50` files): charting, selectors, analytics presentation logic.
- API-backed feature slices (`datasets`, `overview`, `majors`, `migration`, `forecasts`, `submissions`) expose service modules.
- `filters` and `upload` provide UI controls and upload actions.
- `exports` feature directory exists but currently has no source files.

### Shared (`src/shared/*`)

- `src/shared/ui` (`127` files): shadcn/radix-style primitives and composed UI building blocks.
- `src/shared/hooks` (`5` files): real hook implementations (`useToast`, `useIsMobile`) + toast internals.
- `src/shared/components` (`1` file): theme provider.
- `src/shared/utils` (`1` file): `cn` helper.

### API + Errors (`src/lib/api/*`)

- `client.ts` (`438` LOC): HTTP client, caching, request execution.
- `types.ts` (`272` LOC): API payload contracts.
- `errors.ts`, `normalize.ts`, `queryGuardrails.ts`, `service-helpers.ts`: boundary validation and transport helpers.

## Step 1: Structural Pain Points

- God modules:
  - `src/features/dashboard/hooks/useDashboardMetricsModel.ts` (`862` LOC) orchestrates data bootstrapping, polling, mutation, and UI-state projection in one place.
  - `src/lib/api/client.ts` (`438` LOC) is a broad networking/caching hub.
- Module boundary ambiguity:
  - Dashboard hook imports service modules via deep concrete paths (`api/<feature>Service`) instead of stable feature-level API entrypoints.
- Legacy duplicate access paths:
  - Hook compatibility wrappers exist under `src/shared/ui` (`use-mobile`, `use-toast`) while canonical logic is in `src/shared/hooks`.
- Mixed maturity levels:
  - Route groups for `(data)` and `(exports)` are docs-only placeholders while dashboard is production path; structure should make this explicit.
- Circular dependency risk:
  - `madge` found no current circular deps, but large orchestrators and many leaf UI modules increase future risk if boundaries drift.

## Step 3: Purge + Structure Plan (Written Before Execution)

### Items To Delete (evidence-backed)

- `src/shared/ui/use-mobile.tsx`
- `src/shared/ui/use-toast.ts`
- `calculateFiveYearGrowthRate` export from `src/features/metrics/utils/metrics-summary-utils.ts`
- `SubmissionCreateResponse` export from `src/lib/api/types.ts`

### Items To Consolidate

- Introduce scoped stable entrypoints:
  - `src/features/<feature>/api/index.ts` for dashboard-consumed feature APIs.
  - `src/features/dashboard/hooks/index.ts` for dashboard model hook export.
  - `src/shared/hooks/index.ts` for canonical hook access.
- Update dashboard runtime imports and affected tests/mocks to consume the stable entrypoints.

### Renames/Moves

- None planned (reduce churn).

### Update Points

- `src/features/dashboard/hooks/useDashboardMetricsModel.ts` imports.
- `src/app/(dashboard)/page.tsx` hook import.
- Jest mocks/import paths in tests touching dashboard API modules and shared hooks.
- Tests referencing deleted legacy wrappers/util exports.
- Campaign docs and report files under `docs/`.

### Rollback Plan

1. Revert this campaign commit(s) to restore previous structure in one step.
2. If partial rollback is needed, restore deleted wrappers/types and switch imports back to concrete file paths.
3. Re-run gates (`lint`, `typecheck`, `test`, `build`) after rollback to validate full restoration.
