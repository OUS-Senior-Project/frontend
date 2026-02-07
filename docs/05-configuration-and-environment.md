# 05 Configuration And Environment Variables

## Current state
- No frontend runtime API URL configuration is used in app source.
- No backend integration env vars are consumed by `app/src/*`.
- `app/next.config.mjs` contains build/runtime config for Next behavior, not backend API wiring.

## Existing env usage in repository scripts
- `COVERAGE_TARGET`
- `GREEN_COLOR`
- `RESET_COLOR`
- `BROWSERSLIST_IGNORE_OLD_DATA`
- `BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA`

These are used by helper scripts and shell tooling, not by dashboard runtime data fetching.

## Build vs runtime summary
- Runtime app config: static Next settings (`app/next.config.mjs`).
- Script-time config: shell/script env vars in `precommit.sh` and `app/scripts/*`.
