# Testing Campaign Implementation Report

## 1) Campaign Plan + Risk List

### Plan (executed)
1. Baseline all quality gates and coverage.
2. Identify weak spots by behavior depth and reliability risk (not just line coverage).
3. Stabilize harness with shared render/network/time utilities and strict cleanup.
4. Add high-signal API client behavior tests for deterministic query/caching/error classification.
5. Keep all gates green and re-run full verification.

### Primary risks
- Global cleanup changes can accidentally interfere with mocked module contracts.
- New shared helpers can drift from test intent if too abstract.
- Timer and Date mocking can leak if not reset centrally.

### Mitigations
- Defensive cleanup (`clearDatasetResponseCache` only when available).
- Narrow helper responsibilities (`render`, `dashboardPage`, `http`, `time`).
- Forced timer/time reset in `afterEach`.

## 2) Baseline & Inventory (Step 0)

### Environment
- `git status --porcelain --branch` -> `## main...origin/main`
- `node -v && npm -v` -> `v25.2.1`, `11.6.2`

### Install and gates (baseline)
- `npm ci` (in `app/`) completed successfully.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test -- --coverage` passed.
- `npm run build` passed.

### Baseline coverage snapshot
- Global: **100% statements / 100% branches / 100% functions / 100% lines**
- Tests: **239 passed** (baseline run)

### Top 10 weakly-tested or reliability-risk areas (baseline)
Coverage had no uncovered files, so weaknesses were quality/reliability oriented:
1. `test/setup-tests.ts` (no strict global cleanup for timers/time/cache/mocks).
2. `test/pages/page.test.tsx` (duplicated dashboard model fixture; maintenance risk).
3. `test/pages/dashboard-page-states.test.tsx` (duplicated dashboard model fixture; maintenance risk).
4. `test/lib/api-boundary.test.ts` (duplicated fetch/response mock plumbing).
5. `test/lib/service-modules.test.ts` (duplicated fetch/response mock plumbing).
6. `src/lib/api/client.ts` canonical query ordering existed but lacked exact deterministic-order assertion.
7. `src/lib/api/client.ts` retryability mapping existed but lacked explicit status-matrix assertions.
8. `src/lib/api/client.ts` 304 cached response path existed but lacked identity-level cache assertion.
9. `test/hooks/use-analytics-dashboard-data.test.tsx` ad-hoc `Date.now` stubs repeated across tests.
10. Shared test helper layer was missing for dashboard render/network/time workflows.

### Flaky pattern inventory (baseline)
- Repeated ad-hoc fake timer setup/teardown patterns.
- Repeated direct `Date.now` spies (manually restored per-test).
- Repeated custom fetch-mock scaffolding across files.
- No centralized post-test cache reset for dataset ETag cache.

## 3) Implementation Log (What Changed and Why)

### A) Harness stabilization
- Added `test/utils/render.tsx`:
  - `renderWithProviders()` to standardize component rendering entry point.
- Added `test/utils/dashboardPage.tsx`:
  - `buildDashboardModel()` + `renderDashboard()` with sane defaults for page-state tests.
- Added `test/utils/http.ts`:
  - centralized `installFetchMock`, `jsonResponse`, `emptyResponse`, `textResponse`.
- Added `test/utils/time.ts`:
  - centralized `mockNow()` and `resetMockNow()`.
- Updated `test/setup-tests.ts`:
  - strict `afterEach` cleanup for cache/timers/mocks/time.
  - defensive cache cleanup for suites that mock `@/lib/api/client`.

Why this matters:
- Reduces cross-test state leakage.
- Removes repeated mock boilerplate.
- Makes future tests faster to write and less error-prone.

### B) Orchestrator test reliability
- Updated `test/hooks/use-analytics-dashboard-data.test.tsx`:
  - replaced manual `Date.now` spy logic with shared `mockNow()` helper.

Why this matters:
- Polling/timeout tests are now deterministic with shared time control semantics.

### C) API client behavior coverage improvements
- Updated `test/lib/api-boundary.test.ts`:
  - added deterministic canonical query ordering assertion.
  - added retryability status matrix assertions (`400/408/429/500`).
  - added 304 cache identity assertion (`second === first` for cached payload path via `createApiClient`).
- Refactored to use shared `test/utils/http.ts` helpers.

Why this matters:
- Verifies key contract details of `client.ts` that impact dedupe/cache stability and user-facing retry behavior.

### D) UI-state test maintainability
- Updated `test/pages/page.test.tsx` and `test/pages/dashboard-page-states.test.tsx` to use shared dashboard render/model helpers.

Why this matters:
- Fewer duplicated fixtures; easier state-case additions without drift.

### E) Query guardrails and API mock maintainability
- Updated `test/lib/service-modules.test.ts` to use shared fetch/response helpers.

Why this matters:
- Single place to evolve response mock behavior.

## 4) Critical Journey Coverage Mapping

1. Dashboard bootstrap
- Active dataset (200) -> panels load: covered in `test/hooks/use-analytics-dashboard-data.test.tsx`.
- No active dataset (`ACTIVE_DATASET_NOT_FOUND`/404) -> no-dataset state: covered in hook and page-state tests.

2. Upload flow
- Upload success -> poll submission -> terminal state -> dataset refresh: covered in hook tests.
- Upload conflict/failure mapping to UI-safe state: covered in hook tests (`DATASET_*` and submission failure branches).

3. Processing/failed reads
- `409 DATASET_NOT_READY` -> processing + dataset polling: covered in hook tests.
- `409 DATASET_FAILED` -> failed terminal state: covered in hook tests.

4. API client normalization
- Timeout/abort/network/envelope/request-id/retryable: covered in `test/lib/api-boundary.test.ts`.

5. Query guardrails
- Allowlist filtering and dropped unknown/invalid params with predictable behavior: covered in `test/lib/service-modules.test.ts`.

6. Dataset ETag caching
- `If-None-Match` sent and 304 cache path behavior: covered in `test/lib/api-boundary.test.ts` (including identity assertion).

## 5) Flakiness Mitigations Added
- Central `mockNow()` utility for deterministic clock control.
- Global post-test timer reset and forced return to real timers.
- Global mock reset/restore.
- Dataset response cache cleanup after each test (when available).
- Shared HTTP mock builders to reduce inconsistent stubbing behavior.

## 6) New Test Helpers
- `test/utils/render.tsx`
  - Use for component render entry points.
- `test/utils/dashboardPage.tsx`
  - Use for dashboard page state tests (`buildDashboardModel`, `renderDashboard`).
- `test/utils/http.ts`
  - Use for client/service boundary fetch-based tests.
- `test/utils/time.ts`
  - Use for timeout/polling tests needing stable `Date.now()`.

## 7) Final Verification Log (Post-change)

### Commands and results
- `npm run lint` -> passed.
- `npm run typecheck` -> passed.
- `npm test` -> passed (`38` suites, `245` tests).
- `npm test -- --coverage` -> passed.
  - Global coverage remains **100/100/100/100**.
- `npm run build` -> passed.

### Output snippets
- Lint: `eslint "src/**/*.{ts,tsx,js,jsx}" --max-warnings=0`
- Typecheck: `tsc --noEmit --project tsconfig.typecheck.json`
- Test: `Test Suites: 38 passed, 38 total` / `Tests: 245 passed, 245 total`
- Coverage: `All files | 100 | 100 | 100 | 100`
- Build: Next.js production build completed with static routes `/` and `/_not-found`.
