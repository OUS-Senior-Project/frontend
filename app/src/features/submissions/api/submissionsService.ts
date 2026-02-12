import { apiClient } from '@/lib/api/client';
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

interface RequestOptions {
  signal?: AbortSignal;
}

interface ListSubmissionsOptions extends RequestOptions {
  page?: number;
  pageSize?: number;
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
    `${API_PREFIX}/submissions`,
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
    `${API_PREFIX}/submissions/${encodedSubmissionId}`,
    {
      signal: options.signal,
    }
  );

  return mapToDatasetSubmission(response);
}

export async function listSubmissions(
  options: ListSubmissionsOptions = {}
): Promise<SubmissionHistoryListResponse> {
  return apiClient.get<SubmissionHistoryListResponse>(`${API_PREFIX}/submissions`, {
    query: {
      page: options.page ?? 1,
      pageSize: options.pageSize ?? 20,
      status: options.status,
      createdAfter: options.createdAfter,
      createdBefore: options.createdBefore,
    },
    signal: options.signal,
  });
}

export async function createBulkSubmissionJob(
  request: CreateBulkSubmissionRequest
): Promise<BulkSubmissionCreateResponse> {
  const formData = new FormData();

  formData.append('activate_latest', String(request.activateLatest ?? true));
  formData.append(
    'continue_on_error',
    String(request.continueOnError ?? true)
  );
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
