# Testing Campaign Strategy

## Scope
This campaign targets frontend test value, determinism, and maintainability for the dashboard-centric Next.js App Router app. Product behavior and backend contracts remain unchanged.

## Test Pyramid for OUS Analytics

### 1) Unit Tests (pure logic)
Use unit tests for:
- `src/lib/api/queryGuardrails.ts`
- `src/lib/api/errors.ts`
- `src/lib/api/normalize.ts`
- selector/utility modules

Assertions should focus on deterministic transformations, error mapping, and guardrail behavior. Avoid DOM rendering for these.

### 2) Integration Tests (hooks + service boundaries)
Use integration tests for:
- `src/features/dashboard/hooks/useDashboardMetricsModel.ts`
- `src/lib/api/client.ts` end-to-end request execution logic (timeouts, abort, ETag handling, canonical query serialization)
- service modules where query filtering and request construction matter

These tests should assert:
- endpoint call order and deduplication behavior,
- stable state transitions (`loading -> processing -> ready/failed`),
- retry behavior and UI-safe normalized error output.

### 3) UI-State Tests (component behavior)
Use component tests for:
- dashboard page state switches (loading/error/no dataset/ready)
- panel state components (`loading`, `processing`, `failed`, `error`, `empty`)
- CTA wiring (`Retry`, `Refresh status`, upload triggers)

Prefer behavior assertions over snapshots.

## Network Mocking Policy

### Preferred
Use centralized network mocks through test utilities. In this campaign:
- `test/utils/http.ts` centralizes fetch/response stubs.

### Dashboard Endpoint Surface to Mock
When adding new dashboard integration tests, keep handlers/mocks aligned with:
- `/datasets/active`
- `/datasets/:id`
- `/datasets/:id/overview`
- `/datasets/:id/analytics-records`
- `/datasets/:id/major-cohort-records`
- `/datasets/:id/migration/options`
- `/datasets/:id/migration-records`
- `/datasets/:id/forecasts`
- `/submissions`
- `/submissions/:id`

### MSW Guidance
MSW remains the preferred path for future cross-module integration scenarios. Current suite uses narrowly scoped fetch and service mocks for speed and minimal runtime overhead.

## Deterministic Time Rules
Use centralized helpers:
- `test/utils/time.ts`
  - `mockNow(initial)` for deterministic `Date.now()` control
  - `resetMockNow()` in global cleanup

Rules:
- never depend on wall-clock `Date.now()` in polling/timeout tests,
- use fake timers only inside test scope,
- always return to real timers during cleanup.

## Deterministic Polling Pattern
For polling tests:
1. enable fake timers,
2. establish explicit checkpoints with `waitFor` (state transition conditions),
3. advance timers in controlled increments,
4. assert call counts and terminal state,
5. restore timers.

Avoid real sleeps and free-running intervals.

## Global Cleanup Contract
`test/setup-tests.ts` enforces:
- dataset response cache clear (when available),
- deterministic clock reset,
- timer reset (`clearAllTimers` + `useRealTimers`),
- mock reset/restore.

This prevents cross-test state bleed and flakiness.

## Render Helper Contract
Use shared render utilities:
- `test/utils/render.tsx` -> `renderWithProviders()`
- `test/utils/dashboardPage.tsx` -> `buildDashboardModel()` + `renderDashboard()`

This keeps dashboard state tests concise and consistent.

## Coverage Targets
- Global coverage must not decrease.
- Critical modules target:
  - `useDashboardMetricsModel.ts`: >= 95% lines/branches
  - `lib/api/client.ts`, `lib/api/errors.ts`, `lib/api/queryGuardrails.ts`: >= 95% lines/branches
- Current repository thresholds (99% global/file) remain enforced.

## When NOT to Write a Test
Do not add tests for:
- static pass-through exports with no branching or behavior,
- implementation details that duplicate library guarantees,
- snapshots that do not capture meaningful behavior,
- branches that can only be reached by impossible runtime states.

Prefer higher-signal behavior tests over bulk low-value assertions.
