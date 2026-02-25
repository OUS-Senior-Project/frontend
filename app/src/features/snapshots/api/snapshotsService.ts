import { apiClient } from '@/lib/api/client';
import {
  buildPaginationQuery,
  encodePathSegment,
  toApiPath,
} from '@/lib/api/service-helpers';
import type {
  SnapshotForecastRebuildJobResponse,
  SnapshotListResponse,
  SnapshotStatus,
} from '@/lib/api/types';

const SNAPSHOTS_ENDPOINT = toApiPath('/snapshots');
const LIST_SNAPSHOTS_QUERY_ALLOWLIST = [
  'page',
  'pageSize',
  'status',
  'academicPeriod',
  'startDate',
  'endDate',
] as const;

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
