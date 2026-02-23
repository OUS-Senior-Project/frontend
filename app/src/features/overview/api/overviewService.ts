import { apiClient } from '@/lib/api/client';
import { ServiceError } from '@/lib/api/errors';
import {
  isRawDatasetOverviewResponse,
  normalizeDatasetOverviewResponse,
} from '@/lib/api/normalize';
import {
  buildGuardedQuery,
  encodePathSegment,
  toApiPath,
  withDatasetCache,
} from '@/lib/api/service-helpers';
import type { DatasetOverviewResponse } from '@/lib/api/types';

const OVERVIEW_QUERY_ALLOWLIST = ['asOfSubmissionId'] as const;

interface GetDatasetOverviewOptions {
  asOfSubmissionId?: string;
  signal?: AbortSignal;
}

export async function getDatasetOverview(
  datasetId: string,
  options: GetDatasetOverviewOptions = {}
): Promise<DatasetOverviewResponse> {
  const endpoint = toApiPath(
    `/datasets/${encodePathSegment(datasetId)}/overview`
  );

  const rawResponse = await apiClient.get<unknown>(
    endpoint,
    withDatasetCache(datasetId, {
      query: buildGuardedQuery({
        endpoint,
        params: {
          asOfSubmissionId: options.asOfSubmissionId,
        },
        allowedKeys: OVERVIEW_QUERY_ALLOWLIST,
      }),
      signal: options.signal,
    })
  );

  if (!isRawDatasetOverviewResponse(rawResponse)) {
    throw new ServiceError(
      'INVALID_RESPONSE_SHAPE',
      'Overview response was malformed.',
      {
        retryable: false,
        details: { endpoint, datasetId },
      }
    );
  }

  return normalizeDatasetOverviewResponse(rawResponse);
}
