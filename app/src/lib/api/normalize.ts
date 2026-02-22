import type {
  DatasetForecastPoint,
  DatasetForecastResponse,
  DatasetOverviewResponse,
  DatasetTrendPoint,
} from './types';
import { normalizeSemesterLabel } from '@/lib/format/semester';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRawDatasetTrendPoint(value: unknown): value is RawDatasetTrendPoint {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.period === 'string' &&
    isFiniteNumber(value.year) &&
    isFiniteNumber(value.total) &&
    (value.semester === undefined ||
      value.semester === null ||
      typeof value.semester === 'string' ||
      isFiniteNumber(value.semester))
  );
}

function isRawDatasetForecastPoint(
  value: unknown
): value is RawDatasetForecastPoint {
  if (!isRawDatasetTrendPoint(value)) {
    return false;
  }

  const maybeForecastPoint = value as RawDatasetForecastPoint;
  return maybeForecastPoint.isForecasted === true;
}

export function isRawDatasetOverviewResponse(
  value: unknown
): value is RawDatasetOverviewResponse {
  if (!isRecord(value) || !Array.isArray(value.trend)) {
    return false;
  }

  return value.trend.every(isRawDatasetTrendPoint);
}

export function isRawDatasetForecastResponse(
  value: unknown
): value is RawDatasetForecastResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.historical) ||
    !Array.isArray(value.forecast)
  ) {
    return false;
  }

  return (
    value.historical.every(isRawDatasetTrendPoint) &&
    value.forecast.every(isRawDatasetForecastPoint)
  );
}

export function normalizeDatasetTrendPoint(
  point: RawDatasetTrendPoint
): DatasetTrendPoint {
  return {
    ...point,
    semester: normalizeSemesterLabel(point.semester),
  };
}

export function normalizeDatasetForecastPoint(
  point: RawDatasetForecastPoint
): DatasetForecastPoint {
  return {
    ...point,
    semester: normalizeSemesterLabel(point.semester),
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
