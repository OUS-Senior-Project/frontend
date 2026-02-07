# OUS Enrollment Dashboard (frontend)

React + TypeScript dashboard for undergraduate enrollment insights. Users upload a Workday enrollment spreadsheet (.xlsx or .xls); the app sends it to the backend and displays enrollment metrics, GPA/credits charts, and a major-level summary by classification. Uses Tailwind for styling, Recharts for charts, and Axios for the upload API.

## Stack

- React 19 (CRA, react-scripts 5) + TypeScript
- TailwindCSS + PostCSS/Autoprefixer
- Recharts, lucide-react icons
- Testing Library + Jest (with mocks for axios/recharts)

## Project structure

- `app/` – CRA project root
  - `src/` – TypeScript components, charts, API, types
  - `src/api/` – axios client (`client.ts`) and file upload (`upload.ts`)
  - `src/components/` – UI (Header, FileUploadPanel, MetricTile, GPABarChart, CreditsBarChart, MajorInsights, MajorSummaryByClassification, MajorSummaryTable, ExportButton)
  - `src/types.ts` – shared types and upload response shape
  - `tailwind.config.js`, `postcss.config.js` – Tailwind setup
- `.github/workflows/` – lint, test, and coverage CI for pushes/PRs
- `runFrontend.sh` / `precommit.sh` – helper scripts at repo root

## Prerequisites

- Node 18.x (matches GitHub Actions); npm
- Backend API running and reachable at the URL you set in `REACT_APP_API_BASE`

## Setup

```bash
cd app
npm install
```

## Running locally

- From repo root: `./runFrontend.sh` (installs if needed, runs `npm start`)
- Or manually: `cd app && npm start`

Open [http://localhost:3000](http://localhost:3000). The dashboard is empty until you upload a file.

## Environment

Create `app/.env.local` (or `.env`) with:

```bash
REACT_APP_API_BASE=http://localhost:8000
```

- Use **http** (not https) for a typical local backend.
- The app calls **POST** `{REACT_APP_API_BASE}/api/v1/upload` with a multipart file. The backend must accept `.xlsx`/`.xls` and return a JSON body with `file_id`, `filename`, `status`, `enrollment_metrics`, and `program_metrics` (including `by_class_and_program` and `summary`). If the env var is missing, upload will fail with a clear error.

## How the dashboard works

1. **Upload** – User selects a Workday enrollment file (.xlsx or .xls) in the “Upload Workday Enrollment File” panel. The file is sent to `POST /api/v1/upload`.
2. **Response** – The backend returns enrollment counts (total, undergrad, FTIC, transfer) and program metrics by classification (e.g. Freshman, Sophomore) with per-program GPA, credits, and student count.
3. **UI** – On success, the app shows:
   - **Enrollment Overview** – Tiles for total enrollment, undergraduate, FTIC, transfer (international shown as “—” if not in the API).
   - **Major Insights** – Average GPA by major and average credits by major (bar charts), plus a **Major-Level Summary** table by classification.

Until an upload succeeds, the overview and insights sections are empty.

## Scripts (from `app/`)

- `npm start` – dev server
- `npm test` – Jest/RTL (watch in local terminals)
- `npm run build` – production build
- `npm run lint` – ESLint (.js/.jsx/.ts/.tsx)
- `npm run lint:fix` – ESLint with `--fix` (JS/JSX only; extend if desired)
- `npm run format` / `npm run format:check` – Prettier

## Pre-commit helper

From repo root, `./precommit.sh` runs Prettier, ESLint, then tests (`CI=true npm test -- --watch=false`).

## Testing notes

- `src/__mocks__/axios.ts` and `src/__mocks__/recharts.js` mock network and chart libs for predictable tests.
- `src/App.test.tsx` checks that the dashboard and upload panel render (header, “Upload Workday Enrollment File”, “Enrollment Overview”).

## Styling

- Tailwind layers are imported in `src/index.css`; utilities are used across components.
- Adjust design tokens in `tailwind.config.js` as needed.

## CI

- **frontend-lint.yml** – Prettier check + ESLint on PRs/pushes (Node 18, `npm ci`).
- **frontend-test.yml** – Tests (`CI=true npm test -- --watchAll=false`) and build on PRs/pushes.
- **frontend-coverage.yml** – Test coverage on PRs/pushes.
