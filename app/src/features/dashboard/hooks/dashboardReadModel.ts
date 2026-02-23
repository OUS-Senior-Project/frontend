import { ServiceError, toUIError } from '@/lib/api/errors';
import type { DatasetSummary, UIError } from '@/lib/api/types';

export type DashboardReadModelState =
  | {
      kind: 'ready';
    }
  | {
      kind: 'processing';
      datasetId: string;
      status: string;
    }
  | {
      kind: 'failed';
      datasetId: string;
      status: string;
      error: UIError;
    };

export type DashboardViewState =
  | 'loading'
  | 'ready'
  | 'processing'
  | 'failed'
  | 'notFound'
  | 'genericError';

interface DashboardDatasetSnapshot {
  loading: boolean;
  error: UIError | null;
  data: DatasetSummary | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

export function createDatasetFailedError(
  datasetId: string,
  status = 'failed',
  message = 'Dataset processing failed. Upload a new dataset to continue.'
): UIError {
  return {
    code: 'DATASET_FAILED',
    message,
    retryable: false,
    status: 409,
    details: {
      datasetId,
      status,
    },
  };
}

export function getDashboardReadModelStateFromDataset(
  dataset: DatasetSummary
): DashboardReadModelState {
  if (dataset.status === 'ready') {
    return {
      kind: 'ready',
    };
  }

  if (dataset.status === 'failed') {
    return {
      kind: 'failed',
      datasetId: dataset.datasetId,
      status: dataset.status,
      error: createDatasetFailedError(dataset.datasetId),
    };
  }

  return {
    kind: 'processing',
    datasetId: dataset.datasetId,
    status: dataset.status,
  };
}

export function getDashboardReadModelStateFromError(
  error: unknown,
  fallbackDatasetId: string
): DashboardReadModelState | null {
  if (!(error instanceof ServiceError) || error.status !== 409) {
    return null;
  }

  if (error.code !== 'DATASET_NOT_READY' && error.code !== 'DATASET_FAILED') {
    return null;
  }

  const details = asRecord(error.details);
  const datasetId =
    typeof details?.datasetId === 'string'
      ? details.datasetId
      : fallbackDatasetId;
  const status =
    typeof details?.status === 'string'
      ? details.status
      : error.code === 'DATASET_NOT_READY'
        ? 'building'
        : 'failed';

  if (error.code === 'DATASET_NOT_READY') {
    return {
      kind: 'processing',
      datasetId,
      status,
    };
  }

  const uiError = toUIError(
    error,
    'Dataset processing failed. Upload a new dataset to continue.'
  );

  return {
    kind: 'failed',
    datasetId,
    status,
    error: {
      ...uiError,
      retryable: false,
    },
  };
}

export function isActiveDatasetNotFound(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: unknown; status?: unknown };
  if (maybeError.code !== 'ACTIVE_DATASET_NOT_FOUND') {
    return false;
  }

  if (maybeError.status !== undefined && maybeError.status !== 404) {
    return false;
  }

  return true;
}

export function shouldRetainCurrentReadModelState(
  currentState: DashboardReadModelState,
  nextState: DashboardReadModelState
) {
  if (
    currentState.kind === 'failed' &&
    nextState.kind === 'processing' &&
    currentState.datasetId === nextState.datasetId
  ) {
    return true;
  }

  if (currentState.kind === 'ready' && nextState.kind === 'ready') {
    return true;
  }

  if (
    currentState.kind === 'processing' &&
    nextState.kind === 'processing' &&
    currentState.datasetId === nextState.datasetId &&
    currentState.status === nextState.status
  ) {
    return true;
  }

  if (
    currentState.kind === 'failed' &&
    nextState.kind === 'failed' &&
    currentState.datasetId === nextState.datasetId &&
    currentState.status === nextState.status &&
    currentState.error.code === nextState.error.code &&
    currentState.error.message === nextState.error.message
  ) {
    return true;
  }

  return false;
}

export function getDashboardViewState(
  datasetState: DashboardDatasetSnapshot,
  readModelState: DashboardReadModelState
): DashboardViewState {
  const noDataset =
    !datasetState.loading && !datasetState.error && !datasetState.data;

  if (datasetState.loading) {
    return 'loading';
  }

  if (datasetState.error) {
    return 'genericError';
  }

  if (noDataset) {
    return 'notFound';
  }

  return readModelState.kind;
}
