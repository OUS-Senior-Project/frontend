# Contributing to Frontend

This guide covers day-to-day frontend contribution standards for `frontend/app`.

## Local Workflow

From `frontend/`:

```bash
cd app
if [ ! -f .env.local ]; then cp .env.local.example .env.local; fi
npm ci
cd ..
npm run dev
```

Before opening a PR, run:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

For full local parity with CI/precommit gates:

```bash
npm run precommit
```

## Architecture Conventions

Keep boundaries consistent with existing modules:

- Routes/shell: `app/src/app/*`
- Dashboard orchestration: `app/src/features/dashboard/*`
- Feature APIs: `app/src/features/<feature>/api/*Service.ts`
- Transport/error/query helpers: `app/src/lib/api/*`
- Shared UI primitives: `app/src/shared/ui/*`

### Rule: service layer owns backend contracts

UI components/hooks should call feature service functions, not build raw fetch paths/queries themselves.

## Adding a New Dashboard Panel

1. Create panel component in `app/src/features/dashboard/components/panels/`.
2. Add/extend feature service in `app/src/features/<feature>/api/`.
3. Extend `useDashboardMetricsModel`:
- add panel `AsyncResourceState`
- add panel loader via shared `loadDashboardResource`
- expose `loading`, `error`, `data`, and retry callback
4. Wire the panel in `DashboardTabs.tsx`.
5. Reuse read-model gating pattern (`ready`/`processing`/`failed`) from existing panels.

## Adding or Updating API Services

Follow these rules from `lib/api/service-helpers.ts` and `queryGuardrails.ts`:

1. Build paths with `toApiPath(...)`.
2. Encode dynamic IDs with `encodePathSegment(...)`.
3. Build allowlisted query objects with `buildGuardedQuery(...)`.
4. For paginated endpoints, use `buildPaginationQuery(...)`.
5. For dataset-scoped GETs, use `withDatasetCache(datasetId, ...)`.
6. Validate/normalize non-trivial response shapes before returning typed data.

## Testing Guidance

### What to test

- Unit: query guardrails, error mapping, normalization, selectors/utilities
- Integration: `useDashboardMetricsModel`, service modules, API client behavior
- UI-state: page/panel loading/error/no-dataset/processing/failed rendering and CTA wiring

### Existing test helpers (prefer these)

- `app/test/utils/http.ts` for fetch stubs
- `app/test/utils/time.ts` for deterministic `Date.now()`
- `app/test/utils/render.tsx` for shared render wrapper
- `app/test/utils/dashboardPage.tsx` for page-state tests

### Determinism requirements

- Use fake timers only inside test scope
- Always restore real timers
- Avoid wall-clock sleeps
- Keep polling assertions explicit (`waitFor` checkpoints + controlled timer advances)

### Coverage and gates

- Jest coverage thresholds are `99%` global and per file (`app/jest.config.js`)
- CI runs lint, tests, build, and coverage checks

## Code Style Expectations

- Language: TypeScript + React function components/hooks
- Formatting: Prettier (`singleQuote: true`, `semi: true`, `printWidth: 80`)
- Linting: Next.js ESLint config + Prettier overrides (`app/eslint.config.mjs`)
- Imports: use `@/` alias for `app/src/*`
- Error rendering: map errors with `toUIError(...)` and display via `formatUIErrorMessage(...)`

## PR Checklist

1. Keep behavior changes scoped and intentional.
2. Update docs when changing dashboard states, service contracts, or scripts.
3. Include tests for new state transitions, retry paths, and error branches.
4. Run `lint`, `test`, `typecheck`, and `build` before requesting review.

## Backend References

- API contracts: `../../../backend/docs/api_reference.md`
- Backend local setup: `../../../backend/docs/local_development.md`
- Backend env/config: `../../../backend/docs/configuration_and_env.md`
