# 04 Backend Integration Surface (Planned)

No real backend endpoints are implemented in this frontend repository today.

## Likely integration points
- `app/src/features/metrics/`: repository/service layer replacing mock repository.
- `app/src/features/upload/`: upload + processing-status actions.
- `app/src/features/exports/`: export flows (currently placeholder directory).
- `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`: orchestration hook for replacing local data source with async API data.

## Screens that will require backend data
- Overview panel: snapshot totals, trend series, type/school distributions.
- Majors panel: major distribution, cohort-level GPA/credits/count metrics.
- Migration panel: available semesters and migration records.
- Forecast panel: historical trend and forecasting output if server-owned.
- Upload status: ingestion result/state tied to backend processing.

## Current UI data contracts to preserve
- Analytics records by year/semester/major/school/student type/count.
- Migration records by from-major/to-major/semester/count.
- Cohort summary records by major/cohort with GPA/credits/studentCount.
- Flat arrays consumable by chart/table components.

## Explicit constraints
- Do not treat any endpoint, payload path, or API operation as implemented yet.
- All backend details in this file are future-facing interface planning only.
