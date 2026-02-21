import { apiClient } from '@/lib/api/client';
import { filterQueryParams } from '@/lib/api/queryGuardrails';
import type {
  BulkSubmissionCreateResponse,
  BulkSubmissionStatusResponse,
  CreateSubmissionRequest,
  DatasetSubmission,
  SubmissionHistoryListResponse,
  SubmissionStatus,
  SubmissionStatusResponse,
} from '@/lib/api/types';

const API_PREFIX = '/api/v1';
const SUBMISSIONS_ENDPOINT = `${API_PREFIX}/submissions`;
const LIST_SUBMISSIONS_QUERY_ALLOWLIST = [
  'page',
  'pageSize',
  'status',
  'createdAfter',
  'createdBefore',
] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

type PaginationParams = {
  page?: number;
  pageSize?: number;
};

interface RequestOptions {
  signal?: AbortSignal;
}

interface ListSubmissionsOptions extends RequestOptions, PaginationParams {
  status?: SubmissionStatus;
  createdAfter?: string;
  createdBefore?: string;
}

interface CreateBulkSubmissionRequest extends RequestOptions {
  files: File[];
  activateLatest?: boolean;
  continueOnError?: boolean;
  dryRun?: boolean;
}

function warnPaginationNormalization(
  endpoint: string,
  key: 'page' | 'pageSize',
  value: number,
  fallback: number
) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.warn(
    `[api-query-guardrail] Normalized invalid ${key} for ${endpoint}: ${value} -> ${fallback}`
  );
}

function normalizePaginationValue(
  endpoint: string,
  key: 'page' | 'pageSize',
  value: number | undefined,
  fallback: number
) {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isFinite(value) || value < 1) {
    warnPaginationNormalization(endpoint, key, value, fallback);
    return fallback;
  }

  return value;
}

function buildListSubmissionsQuery(options: ListSubmissionsOptions) {
  const page = normalizePaginationValue(
    SUBMISSIONS_ENDPOINT,
    'page',
    options.page,
    DEFAULT_PAGE
  );
  const pageSize = normalizePaginationValue(
    SUBMISSIONS_ENDPOINT,
    'pageSize',
    options.pageSize,
    DEFAULT_PAGE_SIZE
  );

  return filterQueryParams({
    endpoint: SUBMISSIONS_ENDPOINT,
    params: {
      page,
      pageSize,
      status: options.status,
      createdAfter: options.createdAfter,
      createdBefore: options.createdBefore,
    },
    allowedKeys: LIST_SUBMISSIONS_QUERY_ALLOWLIST,
  });
}

function mapToDatasetSubmission(
  response: DatasetSubmission | SubmissionStatusResponse
): DatasetSubmission {
  return {
    submissionId: response.submissionId,
    datasetId: response.datasetId,
    status: response.status,
    fileName: response.fileName,
    createdAt: response.createdAt,
    ...(response.completedAt !== undefined
      ? { completedAt: response.completedAt }
      : {}),
    ...(response.validationErrors !== undefined
      ? { validationErrors: response.validationErrors }
      : {}),
  };
}

export async function createDatasetSubmission(
  request: CreateSubmissionRequest,
  options: RequestOptions = {}
): Promise<DatasetSubmission> {
  const formData = new FormData();
  formData.append('file', request.file);

  const response = await apiClient.postForm<DatasetSubmission>(
    SUBMISSIONS_ENDPOINT,
    formData,
    {
      query: {
        activate_on_success: request.activateOnSuccess ?? true,
      },
      signal: options.signal,
    }
  );

  return mapToDatasetSubmission(response);
}

export async function getDatasetSubmissionStatus(
  submissionId: string,
  options: RequestOptions = {}
): Promise<DatasetSubmission> {
  const encodedSubmissionId = encodeURIComponent(submissionId);
  const response = await apiClient.get<SubmissionStatusResponse>(
    `${SUBMISSIONS_ENDPOINT}/${encodedSubmissionId}`,
    {
      signal: options.signal,
    }
  );

  return mapToDatasetSubmission(response);
}

export async function listSubmissions(
  options: ListSubmissionsOptions = {}
): Promise<SubmissionHistoryListResponse> {
  return apiClient.get<SubmissionHistoryListResponse>(SUBMISSIONS_ENDPOINT, {
    query: buildListSubmissionsQuery(options),
    signal: options.signal,
  });
}

export async function createBulkSubmissionJob(
  request: CreateBulkSubmissionRequest
): Promise<BulkSubmissionCreateResponse> {
  const formData = new FormData();

  formData.append('activate_latest', String(request.activateLatest ?? true));
  formData.append('continue_on_error', String(request.continueOnError ?? true));
  formData.append('dry_run', String(request.dryRun ?? false));

  request.files.forEach((file) => {
    formData.append('files[]', file);
  });

  return apiClient.postForm<BulkSubmissionCreateResponse>(
    `${API_PREFIX}/submissions/bulk`,
    formData,
    {
      signal: request.signal,
    }
  );
}

export async function getBulkSubmissionJobStatus(
  jobId: string,
  options: RequestOptions = {}
): Promise<BulkSubmissionStatusResponse> {
  const encodedJobId = encodeURIComponent(jobId);
  return apiClient.get<BulkSubmissionStatusResponse>(
    `${API_PREFIX}/submissions/bulk/${encodedJobId}`,
    {
      signal: options.signal,
    }
  );
}
