# 02 User Flows (Current vs Planned)

## A. Current implemented user flow

1. App load
- UI state: Dashboard renders at `/` with `Overview` selected by default.
- Components: `DashboardPage`, `DashboardHeader`, `DashboardTabs`.
- Data source: local mock repository (`getMockAnalyticsRepository()`).

2. Dashboard hydration
- UI state: metrics cards/charts/tables render immediately.
- Components: panel components under `app/src/features/dashboard/components/panels/*` plus metrics components.
- Data source: generated fixtures transformed by selectors.

3. Date filter interaction
- UI state: overview snapshot reflects selected date or fallback semester.
- Components: `DateFilterButton`, `useDashboardMetricsModel`.
- Data source: local `selectedDate` + `selectSnapshotForDate`.

4. Dataset upload interaction
- UI state: selecting a file shows `Successfully loaded: <filename>`.
- Components: `UploadDatasetButton`, `UploadStatusPanel`, `handleDatasetUpload`.
- Data source: local file input event only.
- Constraint: no parsing, no persistence, no backend request.

5. Migration filtering
- UI state: migration chart and top-flow table filter by selected semester.
- Components: `SemesterFilterSelect`, `MigrationFlowChart`, `MigrationTopFlowsTable`.
- Data source: local migration fixture data.

6. Forecast tab
- UI state: forecast metrics/charts display projected series.
- Components: `ForecastsPanel`, `ForecastSection`.
- Data source: local selector-based projection (`selectForecastSeries`).

7. Placeholder and empty states
- Migration has an explicit empty state component when filtered results are empty.
- Upload and exports route groups are placeholders only.

## B. PLANNED user flow (not implemented)
- Upload institutional `.xlsx` data to backend ingestion.
- Backend validation/cleaning/computation and persistence.
- Frontend reloads dashboard from persisted backend dataset(s).
- Multi-dataset workflows (selection/switching/metadata).
- Historical comparisons between periods and dataset versions.
- Backend-supported export flows.
