# 07 Known Gaps And Next Steps

## Current gaps
- No API/data integration layer is active.
- Upload UI is currently CSV-labeled while product target is `.xlsx` ingestion.
- `features/exports` and route-group placeholders are unimplemented.
- Async loading/error states for network-driven data are not yet built.

## Planned next steps
1. Add typed services/repositories for backend-driven metrics and dataset operations.
2. Implement `.xlsx` upload pipeline with backend status handling.
3. Add dataset identity/version selection to dashboard state.
4. Transition selectors from fixture arrays to API responses.
5. Add loading/error/retry states across all dashboard panels.
