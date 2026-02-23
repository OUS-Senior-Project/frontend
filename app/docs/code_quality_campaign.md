# Code Quality Campaign: Frontend Maintainability

Date: 2026-02-22  
Scope: `app/src` (dashboard orchestration, feature services, API utilities)

## Goals

- Improve type-safety and runtime correctness at API boundaries.
- Standardize error handling and user-facing error messaging.
- Consolidate duplicated service logic (pagination/query handling, dataset-cache options).
- Improve dashboard hook readability without changing product behavior or backend contracts.
- Reduce debt hotspots and document conventions for future work.

## Principles

- Keep behavior stable; improve internals and guardrails first.
- Prefer shared helpers over per-feature ad hoc logic.
- Validate untrusted API payloads at service boundaries.
- Keep UI-facing errors consistent and debug-friendly.
- Make state transitions explicit, especially around polling/processing states.

## Patterns Enforced

### 1) Shared API Service Helpers

Use `app/src/lib/api/service-helpers.ts` for:

- `toApiPath(...)` for canonical `/api/v1` path composition.
- `buildGuardedQuery(...)` for allowlisted query construction.
- `buildPaginationQuery(...)` for page/pageSize normalization + query filtering.
- `withDatasetCache(...)` for consistent dataset ETag cache options.
- `encodePathSegment(...)` for safe path segment encoding.

### 2) Runtime Response Shape Guards

For endpoints with normalization steps, validate `unknown` payloads before normalization:

- `isRawDatasetOverviewResponse(...)`
- `isRawDatasetForecastResponse(...)`

If payloads are malformed, throw `ServiceError('INVALID_RESPONSE_SHAPE', ...)` with `retryable: false`.

### 3) Deterministic Semester Utilities

Use `app/src/lib/format/semester.ts` for semester/date semantics:

- `normalizeSemesterLabel(...)`
- `toSemesterOrder(...)`
- `toSemesterLabel(...)`
- `getSemesterLabelForDate(...)`

Avoid scattered `'Fall'/'Spring'` comparisons and implicit fallback logic.

### 4) UI Error Consistency

Use `formatUIErrorMessage(...)` from `app/src/lib/api/errors.ts` for all user-facing API error strings.

- Keeps fallback behavior stable.
- Appends request ID when available to improve debugging.

### 5) Dashboard Read-Model Separation

Move read-model transition helpers to `app/src/features/dashboard/hooks/dashboardReadModel.ts`.

- Keeps hook orchestration focused on side effects and resource loading.
- Centralizes transition rules and state equivalence checks.
- Keeps polling/read-model state behavior explicit.

### 6) Shared Panel Resource Loader Pattern

Use one load pipeline in `useDashboardMetricsModel` for panel resources:

- start measurement
- set loading state
- deduped request
- read-model error mapping
- normalized UI error fallback
- measure cleanup

This removes repeated panel-specific boilerplate and keeps transitions consistent.

## Non-Goals Preserved

- No state-management rewrite.
- No API contract changes.
- No visual redesign.
