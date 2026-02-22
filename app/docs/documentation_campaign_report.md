# Frontend Documentation Campaign Report

Date: 2026-02-22
Area: `frontend`

## Objective

Improve frontend documentation so new engineers can:
- run the app locally quickly,
- understand dashboard processing/read-model state behavior,
- understand API client configuration and caching/error behavior,
- contribute safely with accurate testing/style guidance.

## Step 0 Audit Findings (Before Changes)

Reviewed existing docs:
- `README.md`
- `docs/README.md`
- `docs/05-configuration-and-environment.md`
- `docs/06-local-development-guide.md`
- existing `app/docs/*` campaign and maintainer/testing guides

Gaps/drift found:
1. Root `README.md` still mixed old architecture narrative with current implementation and lacked a focused quickstart for current workflows.
2. No dedicated dashboard state-machine doc for `bootstrap -> no-dataset/dataset-ready/processing/failed` behavior.
3. No dedicated API client contract doc describing canonical query serialization, timeout/abort semantics, dataset ETag/304 cache behavior, and request-id surfacing.
4. No concise frontend contribution guide focused on panel/service conventions, testing utilities, and CI gates.
5. Troubleshooting for common runtime issues (missing base URL, backend down, CORS) was not centralized in the canonical README.

## Documentation Changes

### Updated
- `README.md`

Why:
- made quickstart copy/paste runnable,
- documented required `NEXT_PUBLIC_API_BASE_URL`,
- added script table and practical troubleshooting,
- linked to backend docs instead of duplicating backend internals.

### Added
- `app/docs/dashboard_state_machine.md`
- `app/docs/api_client.md`
- `app/docs/contributing_frontend.md`

Why:
- isolate high-change operational knowledge in focused docs,
- document state/error transitions from current source code,
- provide contributor guidance aligned with actual code and test harness.

## Docs-as-Tests Validation

Commands run and outcomes are listed in the next section.

## Validation Command Log

1. Install + env bootstrap (Quickstart):

```bash
cd app && if [ ! -f .env.local ]; then cp .env.local.example .env.local; fi && npm ci
```

Result:
- Passed.
- `postinstall` script executed (`node ./scripts/patch-browserslist.js`).

2. Dev server startup (Quickstart):

```bash
npm run dev
```

Result:
- Passed.
- Next.js started on `http://localhost:3000` and reported `Ready in 2.9s`.
- Process manually stopped after readiness confirmation.

3. Lint gate:

```bash
npm run lint
```

Result:
- Passed.

4. Test gate:

```bash
npm run test
```

Result:
- Passed.
- `41` suites, `276` tests.

5. Typecheck gate:

```bash
npm run typecheck
```

Result:
- Passed.

6. Build gate:

```bash
npm run build
```

Result:
- Passed.
- Production build completed and prerendered `/` and `/_not-found`.

7. Full precommit parity run:

```bash
npm run precommit
```

Result:
- Passed.
- Includes: `format:check`, lint, `test:ci` with coverage, coverage threshold check (`>=99%`), typecheck, and build.
- Coverage check result: `100.00% >= 99%`.

## PR Summary

This documentation campaign replaced the outdated root frontend README with an implementation-accurate quickstart and troubleshooting guide, and added focused docs for dashboard state transitions, API client contracts, and contribution standards.

Key outcomes:
1. Local setup is now copy/paste runnable with explicit env requirements.
2. Dashboard read-model behavior (`bootstrap`, `no-dataset`, `dataset-ready`, `processing`, `failed`) is documented against real hook logic.
3. API client behavior is documented end-to-end: canonical query serialization, timeout/abort handling, dataset ETag caching, and request-id/error surfacing.
4. Frontend contribution guidance now reflects current panel/service/testing conventions and CI gates.
5. Backend details are linked rather than duplicated (`../../../backend/docs/*` and `../backend/docs/*` links).

## Test Plan Snippet

1. Follow README Quickstart exactly and confirm dev server readiness.
2. Validate missing env troubleshooting by removing/changing `NEXT_PUBLIC_API_BASE_URL` locally and confirming documented error signatures.
3. Validate backend-down troubleshooting by stopping backend and confirming documented `NETWORK_ERROR`/CORS guidance paths.
4. Run frontend gates directly or via `npm run precommit` (`format:check`, lint, tests with coverage, coverage threshold check, typecheck, build).
5. Spot-check docs against source for high-risk behavior in `useDashboardMetricsModel.ts`, `dashboardReadModel.ts`, and `client.ts`.
