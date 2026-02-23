# Dashboard State Machine

This document describes the dashboard read-model lifecycle implemented in:
- `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`
- `app/src/features/dashboard/hooks/dashboardReadModel.ts`
- `app/src/app/(dashboard)/page.tsx`
- `app/src/features/dashboard/components/panels/*.tsx`

## Canonical States

| State | Internal signal | What user sees |
| --- | --- | --- |
| `bootstrap` | `datasetState.loading === true` | Full-page loading card (`Loading dashboard...`). |
| `no-dataset` | `dashboardViewState === 'notFound'` | `DashboardNoDatasetState` with upload CTA. |
| `dataset-ready` | `readModelState.kind === 'ready'` and active dataset exists | Tabs render normal panel loading/error/empty/data states. |
| `processing` | `readModelState.kind === 'processing'` | Each tab renders processing card + `Refresh status`. |
| `failed` | `readModelState.kind === 'failed'` | Each tab renders failed card + upload/refresh guidance. |

Related non-machine branch:
- `genericError` (bootstrap/load failure): `datasetState.error` renders top-level destructive alert with `Retry`.

## Transition Rules

| From | Trigger | To |
| --- | --- | --- |
| `bootstrap` | Active dataset returns `null` | `no-dataset` |
| `bootstrap` | Active dataset status is `ready` | `dataset-ready` |
| `bootstrap` | Active dataset status is `queued`/`building`/`processing` | `processing` |
| `bootstrap` | Active dataset status is `failed` | `failed` |
| `dataset-ready` | Any panel read returns `409 DATASET_NOT_READY` | `processing` |
| `dataset-ready` | Any panel read returns `409 DATASET_FAILED` | `failed` |
| `processing` | Status poll (`getDatasetById`) returns `ready` | `dataset-ready` (then refreshes all panels) |
| `processing` | Status poll returns `failed` | `failed` |
| `processing` | Status poll returns `queued`/`building`/`processing` | stay `processing` |
| `failed` | Same dataset later returns `DATASET_NOT_READY` | stay `failed` (guard prevents downgrade) |
| `failed` | Active dataset changes to a different dataset in non-ready state | `processing` |

Read-model transition dedupe/retention rules are centralized in `shouldRetainCurrentReadModelState(...)`.

## Polling Behavior

### Read-model polling (dataset status)

Triggered only while in `processing`.

- Interval: `3_000ms` (`DATASET_STATUS_POLL_INTERVAL_MS`)
- Max duration: `300_000ms` / 5 minutes (`DATASET_STATUS_POLL_MAX_DURATION_MS`)
- API used: `getDatasetById(datasetId)`
- Timeout behavior:
  - polling stops
  - `readModelPollingTimedOut` becomes `true`
  - UI keeps `processing` state and asks for manual `Refresh status`

### Upload submission polling

Used by `handleDatasetUpload(file)`.

- Submission create: `createDatasetSubmission({ file, activateOnSuccess: true })`
- Poll API: `getDatasetSubmissionStatus(submissionId)`
- Poll delay: `1s`, then steps by `+1s`, capped at `3s`
- Timeout: `180_000ms` (`SUBMISSION_POLL_TIMEOUT_MS`)
- Terminal statuses:
  - `completed`: reload active dataset, then refresh all panel resources
  - `failed`: maps to `uploadError` (see mapping table)

Concurrent upload behavior:
- Starting a new upload aborts the previous in-flight upload/poll flow.

## Backend Error -> UI State Mapping

| Backend/API condition | UI mapping |
| --- | --- |
| `ACTIVE_DATASET_NOT_FOUND` with status `404` (or explicit null response) | `no-dataset` |
| `ACTIVE_DATASET_NOT_FOUND` with non-404 status | top-level `genericError` |
| Other bootstrap errors (`NETWORK_ERROR`, `DATASET_NOT_FOUND`, etc.) | top-level `genericError` |
| Panel fetch `409 DATASET_NOT_READY` | `processing` (panel data/error cleared for that resource) |
| Panel fetch `409 DATASET_FAILED` | `failed` with non-retryable read-model error |
| Panel fetch `409` with other codes | stays `dataset-ready`; error shown on that panel only |
| Forecast fetch `NEEDS_REBUILD` | forecasts panel error with specialized rebuild message |
| `REQUEST_ABORTED` during panel/status fetch | ignored (no visible error transition) |

## Upload Error Mapping

| Upload condition | `uploadError` mapping |
| --- | --- |
| Submission terminal `failed` with validation errors | First validation error `code` + `message` |
| Submission terminal `failed` without validation errors | `SUBMISSION_FAILED` with default message |
| Submission polling exceeds timeout | `SUBMISSION_POLL_TIMEOUT` |
| Upload/create request/network failure | `toUIError(error, \`Unable to upload "<file>".\`)` |

## Notes for New Panel Authors

- Do not add independent processing/failed state machines in panels.
- Consume `readModelState`, `readModelStatus`, `readModelError`, and `readModelPollingTimedOut` from `useDashboardMetricsModel`.
- Keep panel-specific failures panel-local unless they are explicit read-model conflicts (`DATASET_NOT_READY`/`DATASET_FAILED`).
