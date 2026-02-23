# Frontend Maintainers Guide

## Module Map

### App routes

- `app/src/app/(dashboard)/page.tsx`: dashboard route composition.
- `app/src/app/layout.tsx`: global app shell.

### Feature modules

- `app/src/features/dashboard/*`: dashboard page composition, tabs, panel orchestrator hook.
- `app/src/features/*/api/*Service.ts`: feature API boundary modules (datasets, submissions, overview, majors, migration, forecasts).
- `app/src/features/metrics/*`: selectors + metrics visualization components.

### Shared + lib

- `app/src/lib/api/client.ts`: API transport, timeout/abort/error envelope mapping, dataset ETag cache.
- `app/src/lib/api/errors.ts`: `ServiceError`, `ApiError`, `toUIError`, `formatUIErrorMessage`.
- `app/src/lib/api/normalize.ts`: response normalization + response-shape guards.
- `app/src/lib/api/service-helpers.ts`: canonical service helpers for paths/query/pagination/cache options.
- `app/src/lib/format/semester.ts`: canonical semester/date formatting semantics.
- `app/src/shared/ui/*`: reusable UI primitives.

## Conventions for New API Calls

1. Build endpoint paths with `toApiPath(...)`.
2. Encode path IDs with `encodePathSegment(...)`.
3. Build query params with allowlists using `buildGuardedQuery(...)`.
4. For paginated endpoints, use `buildPaginationQuery(...)`.
5. For dataset-scoped GETs, use `withDatasetCache(datasetId, options)`.
6. If response shape is non-trivial, request as `unknown`, validate with a narrow guard, then normalize.
7. Throw `ServiceError('INVALID_RESPONSE_SHAPE', ..., { retryable: false })` for malformed payloads.

## How to Add a New Dashboard Panel

1. Add panel UI component in `app/src/features/dashboard/components/panels/`.
2. Add feature API service module under `app/src/features/<feature>/api/` using shared service helpers.
3. Extend `useDashboardMetricsModel`:
- add `AsyncResourceState` state for panel data,
- add load function via shared `loadDashboardResource` pipeline,
- include retry callback and return fields.
4. Wire panel into `DashboardTabs`:
- add tab trigger,
- render panel conditionally,
- read from `model` prop.
5. Add/extend tests:
- service module tests for endpoint/query behavior,
- hook tests for loading/error/read-model interactions,
- panel/tab tests for rendering and retry behavior.

## Handling Processing / Failed States

- Canonical read-model transitions live in:
  - `app/src/features/dashboard/hooks/dashboardReadModel.ts`
- Rules:
  - `ready`: panels fetch and render normal data state.
  - `processing`: show processing panel state and allow manual refresh.
  - `failed`: show failed panel state with refresh/upload guidance.
- `useDashboardMetricsModel` centralizes:
  - read-model transition application,
  - dataset status polling,
  - automatic panel refresh when processing resolves to ready.

## Error Handling Pattern

- Service layer should throw `ServiceError` / `ApiError` and preserve metadata (`status`, `requestId`, `details`).
- UI layer should always map via `toUIError(...)`.
- UI rendering should use `formatUIErrorMessage(...)` for consistent text and request-id visibility.

## Caching and Query Pitfalls

### CORS / base URL

- `NEXT_PUBLIC_API_BASE_URL` must be set and reachable from browser origin.
- Cross-origin fetch failures are normalized with CORS guidance messaging in `toUIError`.

### Dataset cache

- Dataset-scoped GET caching is ETag-based in `client.ts`.
- Writes that can invalidate dataset reads should call `clearDatasetResponseCache()`.
- Existing invalidation points include dataset activation and submission creation flows.

### Query safety

- Never pass unguarded arbitrary objects as query params.
- Keep endpoint-specific allowlists close to each service function.

## Common Pitfalls

- Forgetting to encode path IDs containing `/`.
- Passing `undefined` query keys without guardrails (use shared helpers).
- Duplicating pagination normalization logic across services.
- Displaying `error.message` directly instead of `formatUIErrorMessage(...)`.
- Re-implementing read-model transitions inside panel components instead of using the hook state.
