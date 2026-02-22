# API Client Contract

Source of truth:
- `app/src/lib/api/client.ts`
- `app/src/lib/api/service-helpers.ts`
- `app/src/lib/api/queryGuardrails.ts`
- `app/src/lib/api/errors.ts`
- `app/src/features/*/api/*Service.ts`

## Base URL + Path Rules

`createApiClient()` reads `process.env.NEXT_PUBLIC_API_BASE_URL`.

Normalization behavior:
- Trims whitespace and trailing `/`
- Removes trailing `/api/v1` from configured base (if present)
- Adds `/api/v1` to request paths exactly once
- Supports both `datasets` and `/datasets` input paths

If base URL is empty at request time, client throws:
- `ServiceError.code = 'MISSING_API_BASE_URL'`

## Query Serialization

`client.get(..., { query })` uses deterministic canonical serialization:
- Query keys sorted alphabetically
- Array values sorted and appended as repeated keys
- `null` and `undefined` values omitted
- Primitives are stringified (`boolean` becomes `true`/`false`)

Example:

```ts
{
  pageSize: 20,
  page: 2,
  status: ['processing', 'failed', 'queued'],
}
```

Serializes to:

```text
?page=2&pageSize=20&status=failed&status=processing&status=queued
```

## Guarded Query Construction (Service Layer)

Service modules should not pass arbitrary query objects directly.

Use helpers:
- `buildGuardedQuery(...)` for allowlisted params
- `buildPaginationQuery(...)` for `page`/`pageSize` defaults + normalization

Guardrail behavior:
- Drops unsupported keys
- Drops invalid values (`NaN`, objects, empty string, empty arrays)
- In non-production, logs dropped/normalized values to aid debugging

## Timeout and Abort Semantics

Default timeout: `15_000ms`.

Client combines caller abort signal with timeout abort:
- Caller abort -> `REQUEST_ABORTED`
- Timeout abort -> `REQUEST_TIMEOUT`
- Non-abort fetch failure -> `NETWORK_ERROR`

These are `ServiceError` instances and are converted to `UIError` in the UI layer.

## `datasetCache` + ETag/304 Behavior

Dataset-scoped GET caching is opt-in via request options:

```ts
withDatasetCache(datasetId, options)
```

Cache key:

```text
datasetId|normalizedApiPath|canonicalQueryString
```

Behavior:
1. First `200` with `etag` stores payload + etag.
2. Next request sends `If-None-Match`.
3. If backend returns `304` and cache entry exists, cached payload is returned.
4. If backend returns `304` but entry is missing, client retries once without `If-None-Match`.
5. If retry still returns `304`, throws `CACHE_MISS`.
6. If subsequent `200` has no `etag`, stale cache entry is dropped.

Invalidation points in current code:
- `activateDataset(...)` (`datasetsService.ts`)
- `createDatasetSubmission(...)` (`submissionsService.ts`)
- `createBulkSubmissionJob(...)` (`submissionsService.ts`)

All call `clearDatasetResponseCache()`.

## Error Envelope + Request ID

Backend error envelope expected shape:

```ts
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  }
}
```

When response is non-2xx:
- Client maps envelope to `ApiError`
- Reads `x-request-id` response header
- Sets `retryable` based on status:
  - `true` for `>=500`, `408`, `429`
  - `false` otherwise

UI surfacing path:
1. `ApiError`/`ServiceError` -> `toUIError(...)`
2. UI render uses `formatUIErrorMessage(...)`
3. Request ID is appended as `(Request ID: <id>)` when present

## Service Author Checklist

For new feature services:
1. Build endpoints with `toApiPath(...)`.
2. Escape path params with `encodePathSegment(...)`.
3. Use query allowlists (`buildGuardedQuery`/`buildPaginationQuery`).
4. Use `withDatasetCache(datasetId, ...)` for dataset-scoped GETs.
5. For complex payloads, fetch as `unknown`, validate shape, then normalize.
6. Throw `ServiceError('INVALID_RESPONSE_SHAPE', ..., { retryable: false })` on malformed payloads.

## Backend Contract References

- API reference: `../../../backend/docs/api_reference.md`
- Backend README: `../../../backend/README.md`
