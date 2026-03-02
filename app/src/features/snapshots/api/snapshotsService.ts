import { apiClient } from '@/lib/api/client';
import {
  buildGuardedQuery,
  buildPaginationQuery,
  encodePathSegment,
  toApiPath,
} from '@/lib/api/service-helpers';
import type {
  SnapshotCoverageResponse,
  SnapshotForecastRebuildJobResponse,
  SnapshotListResponse,
  SnapshotStatus,
} from '@/lib/api/types';

const SNAPSHOTS_ENDPOINT = toApiPath('/snapshots');
const SNAPSHOT_COVERAGE_ENDPOINT = toApiPath('/snapshots/coverage');
const LIST_SNAPSHOTS_QUERY_ALLOWLIST = [
  'page',
  'pageSize',
  'status',
  'academicPeriod',
  'startDate',
  'endDate',
] as const;
const SNAPSHOT_COVERAGE_QUERY_ALLOWLIST = ['startDate', 'endDate'] as const;

interface ListSnapshotsOptions {
  page?: number;
  pageSize?: number;
  status?: SnapshotStatus;
  academicPeriod?: string;
  startDate?: string;
  endDate?: string;
  signal?: AbortSignal;
}

interface SnapshotForecastRebuildOptions {
  signal?: AbortSignal;
}

interface SnapshotCoverageOptions {
  startDate?: string;
  endDate?: string;
  signal?: AbortSignal;
}

export async function listSnapshots(
  options: ListSnapshotsOptions = {}
): Promise<SnapshotListResponse> {
  return apiClient.get<SnapshotListResponse>(SNAPSHOTS_ENDPOINT, {
    query: buildPaginationQuery({
      endpoint: SNAPSHOTS_ENDPOINT,
      page: options.page,
      pageSize: options.pageSize,
      params: {
        status: options.status,
        academicPeriod: options.academicPeriod,
        startDate: options.startDate,
        endDate: options.endDate,
      },
      allowedKeys: LIST_SNAPSHOTS_QUERY_ALLOWLIST,
    }),
    signal: options.signal,
  });
}

export async function createSnapshotForecastRebuildJob(
  snapshotId: string,
  options: SnapshotForecastRebuildOptions = {}
): Promise<SnapshotForecastRebuildJobResponse> {
  return apiClient.post<SnapshotForecastRebuildJobResponse>(
    toApiPath(`/snapshots/${encodePathSegment(snapshotId)}/forecasts/rebuild`),
    undefined,
    {
      signal: options.signal,
    }
  );
}

export async function getSnapshotCoverage(
  options: SnapshotCoverageOptions = {}
): Promise<SnapshotCoverageResponse> {
  return apiClient.get<SnapshotCoverageResponse>(SNAPSHOT_COVERAGE_ENDPOINT, {
    query: buildGuardedQuery({
      endpoint: SNAPSHOT_COVERAGE_ENDPOINT,
      params: {
        startDate: options.startDate,
        endDate: options.endDate,
      },
      allowedKeys: SNAPSHOT_COVERAGE_QUERY_ALLOWLIST,
    }),
    signal: options.signal,
  });
}
