import {
  isRawDatasetForecastResponse,
  isRawDatasetOverviewResponse,
  normalizeDatasetForecastPoint,
  normalizeDatasetForecastResponse,
  normalizeDatasetOverviewResponse,
  normalizeDatasetTrendPoint,
} from '@/lib/api/normalize';

describe('api normalization', () => {
  test('keeps string semester values unchanged', () => {
    const normalized = normalizeDatasetTrendPoint({
      period: 'Fall 2024',
      year: 2024,
      semester: 'Fall',
      total: 1200,
    });

    expect(normalized.semester).toBe('Fall');
  });

  test('coerces numeric semester values to strings', () => {
    const normalized = normalizeDatasetTrendPoint({
      period: 'Unknown 2024',
      year: 2024,
      semester: 2,
      total: 1200,
    });

    expect(normalized.semester).toBe('2');
    expect(typeof normalized.semester).toBe('string');
  });

  test('normalizes forecast point semester values directly', () => {
    const normalized = normalizeDatasetForecastPoint({
      period: 'Future',
      year: 2027,
      semester: 3,
      total: 1300,
      isForecasted: true,
    });

    expect(normalized.semester).toBe('3');
    expect(normalized.isForecasted).toBe(true);
  });

  test.each([null, undefined])(
    'coerces %s semester values to "Unknown"',
    (semester) => {
      const normalized = normalizeDatasetTrendPoint({
        period: 'Unknown 2024',
        year: 2024,
        semester,
        total: 1200,
      });

      expect(normalized.semester).toBe('Unknown');
    }
  );

  test('normalizes mixed overview trend semester values to strings', () => {
    const normalized = normalizeDatasetOverviewResponse({
      datasetId: 'dataset-1',
      snapshotTotals: {
        total: 3,
        undergrad: 3,
        ftic: 1,
        transfer: 1,
        international: 1,
      },
      activeMajors: 1,
      activeSchools: 1,
      trend: [
        { period: 'Fall 2024', year: 2024, semester: 'Fall', total: 1 },
        { period: 'Unknown 2024', year: 2024, semester: 2, total: 1 },
        { period: 'Unknown 2025', year: 2025, semester: null, total: 1 },
      ],
      studentTypeDistribution: [],
      schoolDistribution: [],
    });

    expect(normalized.trend.map((point) => point.semester)).toEqual([
      'Fall',
      '2',
      'Unknown',
    ]);
  });

  test('normalizes mixed forecast semester values in both historical and forecast arrays', () => {
    const normalized = normalizeDatasetForecastResponse({
      datasetId: 'dataset-1',
      state: 'READY',
      methodologySummary: 'Backend methodology text.',
      assumptions: ['Assumption A', 'Assumption B'],
      dataCoverage: {
        minAcademicPeriod: 'Fall 2024',
        maxAcademicPeriod: 'Spring 2025',
      },
      fiveYearGrowthPct: 12.5,
      historical: [
        { period: 'Fall 2024', year: 2024, semester: 'Fall', total: 100 },
        { period: 'Unknown 2024', year: 2024, semester: 2, total: 101 },
      ],
      forecast: [
        {
          period: 'Spring 2025',
          year: 2025,
          semester: undefined,
          total: 102,
          isForecasted: true,
        },
      ],
      insights: {
        projectedGrowthText: 'Projected growth.',
        resourcePlanningText: 'Plan resources.',
        recommendationText: 'Take action.',
      },
    });

    expect(normalized.historical.map((point) => point.semester)).toEqual([
      'Fall',
      '2',
    ]);
    expect(normalized.forecast.map((point) => point.semester)).toEqual([
      'Unknown',
    ]);
    expect(normalized.state).toBe('READY');
    expect(normalized.methodologySummary).toBe('Backend methodology text.');
    expect(normalized.assumptions).toEqual(['Assumption A', 'Assumption B']);
    expect(normalized.dataCoverage).toEqual({
      minAcademicPeriod: 'Fall 2024',
      maxAcademicPeriod: 'Spring 2025',
    });
  });

  test('normalizeDatasetForecastResponse defaults lifecycle fields for legacy payloads', () => {
    const normalized = normalizeDatasetForecastResponse({
      datasetId: 'dataset-legacy',
      fiveYearGrowthPct: 3,
      historical: [
        { period: 'Fall 2024', year: 2024, semester: 'Fall', total: 100 },
      ],
      forecast: [
        {
          period: 'Spring 2025',
          year: 2025,
          semester: 'Spring',
          total: 120,
          isForecasted: true,
        },
      ],
      insights: {
        projectedGrowthText: 'Projected growth.',
        resourcePlanningText: 'Plan resources.',
        recommendationText: 'Take action.',
      },
    });

    expect(normalized.state).toBe('READY');
    expect(normalized.methodologySummary).toBe('');
    expect(normalized.assumptions).toEqual([]);
    expect(normalized.dataCoverage).toBeNull();
    expect(normalized.reason).toBeNull();
    expect(normalized.suggestedAction).toBeNull();
    expect(normalized.error).toBeNull();
  });

  test('normalizes NEEDS_REBUILD lifecycle metadata and guards invalid error payloads', () => {
    const normalized = normalizeDatasetForecastResponse({
      datasetId: 'dataset-needs-rebuild',
      state: 'NEEDS_REBUILD',
      methodologySummary: 'Methodology summary',
      assumptions: ['Assumption'],
      dataCoverage: {
        minAcademicPeriod: 123,
        maxAcademicPeriod: null,
      } as unknown as { minAcademicPeriod: string; maxAcademicPeriod: string },
      fiveYearGrowthPct: null,
      historical: [],
      forecast: [],
      insights: null,
      reason: 'Forecast rows are missing.',
      suggestedAction: 'Rebuild forecasts.',
      error: { code: 'BAD_ONLY' } as unknown as {
        code: string;
        message: string;
      },
    });

    expect(normalized.state).toBe('NEEDS_REBUILD');
    expect(normalized.dataCoverage).toEqual({
      minAcademicPeriod: null,
      maxAcademicPeriod: null,
    });
    expect(normalized.reason).toBe('Forecast rows are missing.');
    expect(normalized.suggestedAction).toBe('Rebuild forecasts.');
    expect(normalized.error).toBeNull();
  });

  test('normalizes FAILED lifecycle error payload and drops non-object error details', () => {
    const normalized = normalizeDatasetForecastResponse({
      datasetId: 'dataset-failed',
      state: 'FAILED',
      methodologySummary: 'Methodology summary',
      assumptions: [],
      dataCoverage: null,
      fiveYearGrowthPct: null,
      historical: [],
      forecast: [],
      insights: null,
      error: {
        code: 'FORECAST_BUILD_FAILED',
        message: 'Forecast build failed.',
        details: 'overflow',
      } as unknown as {
        code: string;
        message: string;
        details: Record<string, unknown>;
      },
    });

    expect(normalized.state).toBe('FAILED');
    expect(normalized.error).toEqual({
      code: 'FORECAST_BUILD_FAILED',
      message: 'Forecast build failed.',
      details: null,
    });
  });

  test('preserves FAILED lifecycle error details when details is an object', () => {
    const normalized = normalizeDatasetForecastResponse({
      datasetId: 'dataset-failed-details',
      state: 'FAILED',
      methodologySummary: 'Methodology summary',
      assumptions: [],
      dataCoverage: null,
      fiveYearGrowthPct: null,
      historical: [],
      forecast: [],
      insights: null,
      error: {
        code: 'FORECAST_BUILD_FAILED',
        message: 'Forecast build failed.',
        details: { datasetId: 'dataset-failed-details' },
      },
    });

    expect(normalized.error).toEqual({
      code: 'FORECAST_BUILD_FAILED',
      message: 'Forecast build failed.',
      details: { datasetId: 'dataset-failed-details' },
    });
  });

  test('isRawDatasetOverviewResponse validates required trend shape', () => {
    expect(
      isRawDatasetOverviewResponse({
        datasetId: 'dataset-1',
        trend: [
          { period: 'Fall 2024', year: 2024, semester: 'Fall', total: 10 },
        ],
      })
    ).toBe(true);

    expect(
      isRawDatasetOverviewResponse({
        datasetId: 'dataset-1',
        trend: [
          { period: 'Fall 2024', year: '2024', semester: 'Fall', total: 10 },
        ],
      })
    ).toBe(false);
    expect(isRawDatasetOverviewResponse({ trend: [123] })).toBe(false);
    expect(isRawDatasetOverviewResponse({ trend: 'bad' })).toBe(false);
  });

  test('isRawDatasetForecastResponse validates historical and forecast point shapes', () => {
    expect(
      isRawDatasetForecastResponse({
        datasetId: 'dataset-1',
        historical: [
          { period: 'Fall 2024', year: 2024, semester: 'Fall', total: 10 },
        ],
        forecast: [
          {
            period: 'Spring 2025',
            year: 2025,
            semester: 'Spring',
            total: 12,
            isForecasted: true,
          },
        ],
      })
    ).toBe(true);

    expect(
      isRawDatasetForecastResponse({
        datasetId: 'dataset-1',
        historical: [
          { period: 'Fall 2024', year: 2024, semester: 'Fall', total: 10 },
        ],
        forecast: [
          {
            period: 'Spring 2025',
            year: 2025,
            semester: 'Spring',
            total: 12,
          },
        ],
      })
    ).toBe(false);
    expect(
      isRawDatasetForecastResponse({
        datasetId: 'dataset-1',
        historical: [123],
        forecast: [],
      })
    ).toBe(false);
    expect(
      isRawDatasetForecastResponse({
        datasetId: 'dataset-1',
        historical: [],
        forecast: [123],
      })
    ).toBe(false);
    expect(
      isRawDatasetForecastResponse({ historical: [], forecast: 'bad' })
    ).toBe(false);
  });
});
