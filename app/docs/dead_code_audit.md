# Dead Code Audit

Date: 2026-02-22  
Scope: `app/src`  
Method: static analysis + repo-wide grep + Next.js convention checks + full gate reruns after purge.

## 2A) Static Analysis Inventory

Commands run:

- `npm run lint` -> pass (`src/**/*` only, `--max-warnings=0`)
- `npm run typecheck` -> pass
- `npx depcheck` -> flagged potential unused deps/devDeps (known false-positive risk for Next/Tailwind/Jest tooling; used as signal only)
- `npx ts-prune` -> flagged many exports, including true candidates and re-export false positives
- `npx madge --circular --warning --extensions ts,tsx --ts-config tsconfig.json src` -> no circular dependencies; skipped CSS plugin modules (`tailwindcss`, `tw-animate-css`)
- `npx eslint . --max-warnings=0` -> failed due `coverage/*` and test-only lint config issues; used as inventory signal only, not deletion gate

## 2B/2C) Candidate Evidence and Decisions

### Delete candidates

1. `src/shared/ui/use-mobile.tsx`
- Static signal: `ts-prune` marked wrapper export unused.
- Grep evidence: only referenced in test compatibility import (`test/hooks/use-mobile.test.tsx:54`).
- Framework trap check: not a Next route convention file; no dynamic import usage.
- Risk: very low; canonical hook lives at `src/shared/hooks/useIsMobile.ts`.
- Decision: **DELETE**.

2. `src/shared/ui/use-toast.ts`
- Static signal: `ts-prune` marked wrapper exports unused.
- Grep evidence: only referenced in test compatibility import (`test/hooks/use-toast.test.tsx:3`).
- Framework trap check: not a Next route convention file; no dynamic import usage.
- Risk: very low; canonical hook/store exports live in `src/shared/hooks/useToast.ts`.
- Decision: **DELETE**.

3. `calculateFiveYearGrowthRate` export in `src/features/metrics/utils/metrics-summary-utils.ts`
- Static signal: `ts-prune` flagged as unused export.
- Grep evidence: used only by tests (`test/pages/page.test.tsx`) and not by runtime `src/app` or feature rendering code.
- Framework trap check: plain utility export, no route convention tie-in.
- Risk: low; removing requires updating tests only.
- Decision: **DELETE EXPORT**.

4. `SubmissionCreateResponse` export in `src/lib/api/types.ts`
- Static signal: `ts-prune` flagged as unused export.
- Grep evidence: no imports/usages in `src` or `test`; only declaration location appears.
- Framework trap check: type-only contract, not convention-driven.
- Risk: very low.
- Decision: **DELETE EXPORT**.

### Keep candidates (insufficient confidence)

1. `listDatasets`, `activateDataset`, `listSubmissions`, `createBulkSubmissionJob`, `getBulkSubmissionJobStatus`
- Static signal: `ts-prune` marked unused from runtime paths.
- Grep evidence: referenced heavily in `test/lib/service-modules.test.ts` and part of service-module contract coverage.
- Risk: medium; may be staged API surface for upcoming UI flows.
- Decision: **KEEP** for this campaign.

2. Multiple `src/shared/ui/*` primitive modules reported as orphans by `madge --orphans`
- Static signal: no incoming edges from app runtime graph.
- Grep evidence: many are exercised by component tests and act as reusable primitive library surface.
- Risk: medium/high if removed in bulk; could break maintainers' expected shared UI API.
- Decision: **KEEP** (out of scope for a safe minimal purge).

## 2D) Next.js and Runtime Trap Checks

- Next route convention files present:
  - `src/app/layout.tsx`
  - `src/app/(dashboard)/layout.tsx`
  - `src/app/(dashboard)/page.tsx`
- No `import(...)` dynamic imports detected in `src` during audit.
- Candidate deletions are not route-convention files and not loaded dynamically.

## Purge Gate

Delete actions in this campaign are limited to the 4 delete candidates above and are validated by post-change gates:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
