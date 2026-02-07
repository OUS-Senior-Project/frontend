# 01 Routing And Structure Map

## App entry points
- `app/src/app/layout.tsx`: root layout, global metadata, global CSS, Vercel Analytics component.
- `app/src/app/(dashboard)/page.tsx`: main dashboard page rendered at `/`.
- `app/src/app/(dashboard)/layout.tsx`: passthrough layout for dashboard route group.

`main.tsx` and `App.tsx` do not exist in this repository. Routing is handled by Next.js App Router.

## Routing approach
- Framework routing: Next.js App Router (filesystem routing).
- Route groups: `(dashboard)`, `(data)`, `(exports)`.
- `(data)` and `(exports)` currently contain README placeholders only and do not create active routes.

## Route index (current)
- `/` -> Dashboard page (`app/src/app/(dashboard)/page.tsx`)
  - Tabs: Overview, Majors, Migration, Forecasts.
  - Upload control appears in Overview panel.
- No standalone upload route is wired.
- No standalone exports route is wired.

## Folder structure
- `app/src/app/`: routes, layouts, global styles.
- `app/src/features/dashboard/`: dashboard containers and local state/model orchestration.
- `app/src/features/metrics/`: metric types, mock fixture generation, selectors, chart/table components.
- `app/src/features/upload/`: upload UI components (button/status).
- `app/src/features/filters/`: date/semester filter components.
- `app/src/features/exports/`: currently empty placeholders.
- `app/src/shared/ui/`: UI primitives and reusable view-layer components.
- `app/src/shared/hooks/`: shared hooks.
- `app/src/lib/`: placeholder module directories with README stubs.

## Data and state ownership boundaries
- Mock data location:
  - `app/src/features/metrics/mocks/analytics-repository.ts`
  - `app/src/features/metrics/mocks/fixtures/*`
- State ownership:
  - `app/src/features/dashboard/hooks/useDashboardMetricsModel.ts`
- UI-only behavior:
  - `app/src/features/upload/components/UploadDatasetButton.tsx`
  - `app/src/features/upload/components/UploadStatusPanel.tsx`
- Domain derivations (frontend-local selectors/utilities):
  - `app/src/features/metrics/selectors/*`
  - `app/src/features/metrics/utils/metrics-summary-utils.ts`
