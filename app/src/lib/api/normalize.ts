import type {
  DatasetForecastPoint,
  DatasetForecastResponse,
  DatasetOverviewResponse,
  DatasetTrendPoint,
} from './types';

export type RawDatasetTrendPoint = Omit<DatasetTrendPoint, 'semester'> & {
  semester?: string | number | null;
};

export type RawDatasetForecastPoint = Omit<DatasetForecastPoint, 'semester'> & {
  semester?: string | number | null;
};

export type RawDatasetOverviewResponse = Omit<
  DatasetOverviewResponse,
  'trend'
> & {
  trend: RawDatasetTrendPoint[];
};

export type RawDatasetForecastResponse = Omit<
  DatasetForecastResponse,
  'historical' | 'forecast'
> & {
  historical: RawDatasetTrendPoint[];
  forecast: RawDatasetForecastPoint[];
};

function normalizeSemester(
  semester: string | number | null | undefined
): string {
  if (typeof semester === 'string') {
    return semester;
  }

  if (typeof semester === 'number') {
    // TODO(campaign-3): Backend contract defines semester as string labels; remove this coercion once numeric anomalies are fixed upstream.
    return String(semester);
  }

  return 'Unknown';
}

export function normalizeDatasetTrendPoint(
  point: RawDatasetTrendPoint
): DatasetTrendPoint {
  return {
    ...point,
    semester: normalizeSemester(point.semester),
  };
}

export function normalizeDatasetForecastPoint(
  point: RawDatasetForecastPoint
): DatasetForecastPoint {
  return {
    ...point,
    semester: normalizeSemester(point.semester),
  };
}

export function normalizeDatasetOverviewResponse(
  response: RawDatasetOverviewResponse
): DatasetOverviewResponse {
  return {
    ...response,
    trend: response.trend.map(normalizeDatasetTrendPoint),
  };
}

export function normalizeDatasetForecastResponse(
  response: RawDatasetForecastResponse
): DatasetForecastResponse {
  return {
    ...response,
    historical: response.historical.map(normalizeDatasetTrendPoint),
    forecast: response.forecast.map(normalizeDatasetForecastPoint),
  };
}
