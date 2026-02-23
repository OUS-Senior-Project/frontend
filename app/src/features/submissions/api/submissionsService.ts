import { apiClient, clearDatasetResponseCache } from '@/lib/api/client';
import {
  buildPaginationQuery,
  encodePathSegment,
  toApiPath,
} from '@/lib/api/service-helpers';
import type {
  BulkSubmissionCreateResponse,
  BulkSubmissionStatusResponse,
  CreateSubmissionRequest,
  DatasetSubmission,
  SubmissionHistoryListResponse,
  SubmissionStatus,
  SubmissionStatusResponse,
} from '@/lib/api/types';

const SUBMISSIONS_ENDPOINT = toApiPath('/submissions');
const BULK_SUBMISSIONS_ENDPOINT = `${SUBMISSIONS_ENDPOINT}/bulk`;
const LIST_SUBMISSIONS_QUERY_ALLOWLIST = [
  'page',
  'pageSize',
  'status',
  'createdAfter',
  'createdBefore',
] as const;

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

function buildListSubmissionsQuery(options: ListSubmissionsOptions) {
  return buildPaginationQuery({
    endpoint: SUBMISSIONS_ENDPOINT,
    page: options.page,
    pageSize: options.pageSize,
    params: {
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

  // Upload submissions can eventually mutate active dataset reads.
  clearDatasetResponseCache();

  return mapToDatasetSubmission(response);
}

export async function getDatasetSubmissionStatus(
  submissionId: string,
  options: RequestOptions = {}
): Promise<DatasetSubmission> {
  const encodedSubmissionId = encodePathSegment(submissionId);
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

  const response = await apiClient.postForm<BulkSubmissionCreateResponse>(
    BULK_SUBMISSIONS_ENDPOINT,
    formData,
    {
      signal: request.signal,
    }
  );

  clearDatasetResponseCache();

  return response;
}

export async function getBulkSubmissionJobStatus(
  jobId: string,
  options: RequestOptions = {}
): Promise<BulkSubmissionStatusResponse> {
  const encodedJobId = encodePathSegment(jobId);
  return apiClient.get<BulkSubmissionStatusResponse>(
    `${BULK_SUBMISSIONS_ENDPOINT}/${encodedJobId}`,
    {
      signal: options.signal,
    }
  );
}
