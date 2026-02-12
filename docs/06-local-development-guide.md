# 06 Local Development Guide

## Prerequisites
- Node.js 18+ recommended
- npm

## Install
From repo root:
```bash
cd app
npm install
```

## Run locally
Option 1:
```bash
cd app
npm run dev
```

Option 2:
```bash
./runFrontend.sh
```

App URL: `http://localhost:3000`

## Backend prerequisite
- Start the backend API locally (default assumed at `http://localhost:8000`).
- Frontend expects backend routes under `/api/v1`.

## Useful commands
From `app/`:
- `npm run lint`
- `npm run test`
- `npm run typecheck`
- `npm run build`

From repo root:
- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run typecheck`

## Required env vars
- `NEXT_PUBLIC_API_BASE_URL`
  - Example:
    ```bash
    # app/.env.local
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
    ```

## Known limitations
- UI focuses on active-dataset workflows in MVP1.
- Export workflows are not implemented yet.
