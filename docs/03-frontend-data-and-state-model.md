# 03 Frontend Data And State Model

## Local state model (current)
Defined in `useDashboardMetricsModel`:
- `selectedDate: Date`
- `breakdownOpen: boolean`
- `migrationSemester: string | undefined`
- `uploadedDatasetName: string | null`

## Data schemas (mock + UI contracts)
Defined in `app/src/features/metrics/types.ts`:
- `AnalyticsRecord`: `{ year, semester, major, school, studentType, count }`
- `MigrationRecord`: `{ fromMajor, toMajor, semester, count }`
- `MajorCohortRecord`: `{ major, cohort, avgGPA, avgCredits, studentCount }`
- `TrendPoint`, `ForecastPoint`, `SnapshotTotals`

## Current data pipeline
1. Fixture generators create deterministic in-memory records.
2. Mock repository exposes fixture arrays.
3. Dashboard hook reads arrays.
4. Selectors derive aggregates/series for charts and cards.

## UI assumptions in current implementation
- Data is synchronously available at render time.
- Forecasts are local computed projections.
- Snapshot `international` is currently a fixed formula (`12%` of total).
- Upload success is represented by local file-name state only.

## Backend-replacement targets
- Replace `getMockAnalyticsRepository()` with API-backed repository/service.
- Replace fixture inputs for selectors with fetched responses.
- Replace `uploadedDatasetName` success signal with backend ingestion status model.

## Components assuming synchronous local data
- `app/src/app/(dashboard)/page.tsx`
- `app/src/features/dashboard/components/panels/*`
- Metrics visualization components under `app/src/features/metrics/components/*`
