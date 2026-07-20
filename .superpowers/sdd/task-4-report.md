# Task 4 Report

## Files

- Created `web/default/src/features/home/components/operation-overview-chart.tsx` with the VChart request trend, Beijing-time labels and tooltips, and fixed-size loading and failure states.
- Created `web/default/src/features/home/components/sections/operation-overview.tsx` with four independent authenticated queries, per-source states, aggregate metrics, service-monitoring navigation, and all-failed retry.
- Modified `web/default/src/features/home/components/index.ts` to export `OperationOverview`.
- Modified `web/default/src/features/home/index.tsx` to render `OperationOverview` only for authenticated users in the default homepage composition.

## Commit

- `1c5d76d1e7ceca5bdb925799cb1ea0439d4ca46f feat(web): add homepage operation overview`

## Checks

1. Command:

   ```sh
   cd web/default
   bun test src/features/home/lib/operation-overview.test.ts
   ```

   Result: exit code 0; 4 passed, 0 failed across 1 file.

2. Command:

   ```sh
   cd web/default
   bun run typecheck
   ```

   Result: exit code 0; `tsgo -b` completed without diagnostics.

3. Command:

   ```sh
   cd web/default
   bunx oxlint -c .oxlintrc.json \
     src/features/home/components/operation-overview-chart.tsx \
     src/features/home/components/sections/operation-overview.tsx \
     src/features/home/components/index.ts \
     src/features/home/index.tsx
   ```

   Result: exit code 0; no diagnostics.

4. Command:

   ```sh
   git diff --check
   ```

   Result: exit code 0; no whitespace errors.

## Self-Review

- The request chart always receives the 24-point aggregation after a successful usage query, including an all-zero period; loading and failure retain the fixed `h-56` body.
- All four TanStack queries are independent and use the specified stable keys and stale times. Failed sources display `--` without masking successful sources, while the retry control appears only when all four sources fail and refetches all four.
- The performance calculation consumes aggregate `request_count`, and all values use the existing locale-safe number, compact-number, percent, and Beijing-time formatters.
- The service summary links to `/service-monitoring`; the retry and link controls retain keyboard focus styling and accessible labels.
- `OperationOverview` is below every custom homepage return branch and is conditionally mounted only when `auth.user` exists, so guests and custom homepage overrides do not execute its protected queries.
- Protected project headers and attribution remain unchanged.

## Concerns

- New overview translation keys intentionally remain absent from locale files because Task 5 owns the sanctioned i18n script and locale generation. Until Task 5 lands, non-English locales fall back to the English source keys.

## Review Fix

### Changes

- Added a named chart wrapper and a screen-reader-only list with each Beijing-time request trend point. The new UI copy uses `t()` keys; locale values remain in Task 5 scope.
- Lazy-loaded `sections/operation-overview` directly from the authenticated default homepage branch, removed its barrel export, and added a fixed no-request Suspense fallback.
- Disabled retry-spinner animation when reduced motion is requested.
- Added a component regression test for the chart name and all 24 textual trend points.

### Verification

1. Command:

   ```sh
   cd web/default
   bun test src/features/home/lib/operation-overview.test.ts src/features/home/components/operation-overview-chart.test.tsx
   ```

   Result: exit code 0; 5 passed, 0 failed across 2 files.

2. Command:

   ```sh
   cd web/default
   bun run typecheck
   ```

   Result: exit code 0; `tsgo -b` completed without diagnostics.

3. Command:

   ```sh
   cd web/default
   bunx oxlint -c .oxlintrc.json src/features/home/components/operation-overview-chart.tsx src/features/home/components/operation-overview-chart.test.tsx src/features/home/components/sections/operation-overview.tsx src/features/home/components/index.ts src/features/home/index.tsx
   ```

   Result: exit code 0; no diagnostics.

4. Command:

   ```sh
   cd web/default
   bun run build
   ```

   Result: exit code 0; Rsbuild production build completed successfully.

5. Command:

   ```sh
   cd web/default
   rg -l "Request trend data" dist/static/js
   ```

   Result: exit code 0; the overview text is emitted in `dist/static/js/async/4920.bceeae1ec2.js`, confirming an async chunk.

6. Command:

   ```sh
   git diff --check
   ```

   Result: exit code 0; no whitespace errors.

## Review Fix 2

### Changes

- Restored `export { OperationOverview } from './sections/operation-overview'` in `web/default/src/features/home/components/index.ts` for barrel consumers.
- Replaced the `Home` barrel import of `CTA`, `Features`, `Hero`, `HowItWorks`, and `Stats` with direct section imports in `web/default/src/features/home/index.tsx`, preserving the existing lazy `OperationOverview` import.

### Verification

1. Command:

   ```sh
   cd web/default
   bun run typecheck
   ```

   Result: exit code 0; `tsgo -b` completed without diagnostics.

2. Command:

   ```sh
   cd web/default
   bunx oxlint -c .oxlintrc.json src/features/home/components/index.ts src/features/home/index.tsx src/features/home/components/operation-overview-chart.tsx src/features/home/components/sections/operation-overview.tsx
   ```

   Result: exit code 0; no diagnostics.

3. Command:

   ```sh
   cd web/default
   bun run build
   ```

   Result: exit code 0; Rsbuild production build completed successfully.

4. Command:

   ```sh
   cd web/default
   rg -l "Request trend data" dist/static/js
   ```

   Result: exit code 0; only `dist/static/js/async/4920.bceeae1ec2.js` matched. The initial `dist/static/js` chunk had no match, confirming Request trend data remains async-only.

5. Command:

   ```sh
   git diff --check
   ```

   Result: exit code 0; no whitespace errors.
