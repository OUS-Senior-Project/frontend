# Dashboard Performance Checklist

- Confirm request keys are stable and canonicalized (`runDeduped`, query params sorted).
- Avoid request triggers from UI-only state (for example, date labels that do not affect API params).
- Ensure one polling loop per logical resource key and enforce interval cadence.
- Always pass `AbortSignal` to polling and panel loaders; abort on unmount/cleanup.
- Invalidate dataset cache after write operations (`upload`, `activate`, bulk write flows).
- Render only active/heavy panels where practical; avoid mounting all chart trees at once.
- Memoize expensive derived chart/table inputs (`useMemo`) and avoid repeated selectors in render.
- Keep callback props stable for memoized panels (`useCallback` retry handlers).
- Add/maintain tests for dedupe, polling stop conditions, and cache invalidation behavior.
- Verify with gates before merge: `lint`, `typecheck`, `test`, `build`.
