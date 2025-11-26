# OUS Enrollment Dashboard (frontend)

React + TypeScript dashboard for undergraduate enrollment insights. Uses Tailwind for styling, Recharts for charts, and Axios for live data (with demo fallbacks).

## Stack

- React 19 (CRA, react-scripts 5) + TypeScript
- TailwindCSS + PostCSS/Autoprefixer
- Recharts, lucide-react icons
- Testing Library + Jest (with mocks for axios/recharts)

## Project structure

- `app/` – CRA project root  
  - `src/` – TypeScript components, charts, API client, constants  
  - `src/api/` – axios client + `fetchItems` data loader  
  - `src/components/` – UI pieces (metrics, tables, charts, upload, etc.)  
  - `src/constants.ts` – demo fallback data  
  - `tailwind.config.js`, `postcss.config.js` – Tailwind setup  
- `.github/workflows/` – lint/test CI for pushes/PRs
- `runLocally.sh` / `precommit.sh` – helper scripts at repo root

## Prerequisites

- Node 18.x (matches GitHub Actions); npm

## Setup

```bash
cd app
npm install
```

## Running locally

- From repo root: `./runLocally.sh` (installs if needed, runs `npm start`)
- Or manually: `cd app && npm start`

## Environment

- Create `app/.env` (or `.env.local`) with:
  - `REACT_APP_API_BASE=https://your-api.example.com`
- App calls `GET /items` expecting:

  ```json
  {
    "summaryMetrics": [{ "title": "Total Enrollment", "value": "10,542" }],
    "majorSummaryData": [
      { "major": "Computer Sci.", "avgGpa": 3.2, "avgCredits": 45, "studentCount": 400 }
    ]
  }
  ```

- If the call fails or the env var is missing, the UI shows a warning and falls back to the demo data in `src/constants.ts`.

## Scripts (from `app/`)

- `npm start` – dev server
- `npm test` – Jest/RTL (watch in local terminals)
- `npm run build` – production build
- `npm run lint` – ESLint (.js/.jsx/.ts/.tsx)
- `npm run lint:fix` – ESLint with `--fix` (JS/JSX only; extend if desired)
- `npm run format` / `npm run format:check` – Prettier

## Pre-commit helper

- `./precommit.sh` (from repo root) runs Prettier, ESLint, then tests (`CI=true npm test -- --watch=false`).

## Testing notes

- `src/__mocks__/axios.ts` and `src/__mocks__/recharts.js` mock network and chart libs for predictable tests.
- `src/App.test.tsx` verifies API data rendering and fallback behavior.

## Styling

- Tailwind layers imported in `src/index.css`; utilities used across components.
- Adjust design tokens in `tailwind.config.js` as needed.

## CI

- `frontend-lint.yml`: Prettier check + ESLint on PRs/pushes (Node 18, `npm ci`).
- `frontend-test.yml`: Tests (`CI=true npm test -- --watchAll=false`) and build on PRs/pushes.
