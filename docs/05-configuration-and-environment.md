# 05 Configuration And Environment Variables

## Current state
- Frontend runtime API wiring is enabled through `app/src/lib/api/client.ts`.
- Backend base URL is configured by `NEXT_PUBLIC_API_BASE_URL`.
- API calls are made to `${NEXT_PUBLIC_API_BASE_URL}/api/v1/...`.

## Existing env usage in repository scripts
- `COVERAGE_TARGET`
- `GREEN_COLOR`
- `RESET_COLOR`
- `BROWSERSLIST_IGNORE_OLD_DATA`
- `BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA`

These are used by helper scripts and shell tooling, not by dashboard runtime data fetching.

## Build vs runtime summary
- Runtime app config:
  - `NEXT_PUBLIC_API_BASE_URL` (required for backend calls)
  - static Next settings in `app/next.config.mjs`
- Script-time config:
  - shell/script env vars in `precommit.sh` and `app/scripts/*`

## Required frontend runtime env vars
- `NEXT_PUBLIC_API_BASE_URL`
  - Example: `http://localhost:8000`
  - Development requests are sent to `${NEXT_PUBLIC_API_BASE_URL}/api/v1/...`
