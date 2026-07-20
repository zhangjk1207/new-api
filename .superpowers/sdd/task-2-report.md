# Task 2 Report

## Files changed

- Modified `web/default/src/features/home/components/sections/hero.tsx` with the Xingluo/Zhiqing hero, authentication-aware actions, model-square route, documentation action, and accessible decorative icons.
- Modified `web/default/src/features/home/components/hero-terminal-demo.tsx` with the local `dataspace-31b` routing example and lint-compliant terminal controls and keys.
- Modified `web/default/src/features/home/components/sections/stats.tsx` with the static responsive four-capability strip.

## Commit

`3bf89451b12021848f88747f2852926cc096ff7a` (`feat(web): introduce Zhiqing homepage hero`)

## Verification

- `cd web/default && bun run typecheck`: passed; `tsgo -b` exited 0.
- `cd web/default && bunx oxlint -c .oxlintrc.json src/features/home/components/sections/hero.tsx src/features/home/components/hero-terminal-demo.tsx src/features/home/components/sections/stats.tsx`: passed; exited 0.
- `git diff --check`: passed; exited 0.
- Self-review: confirmed all Task 2 requirements are contained in the three allowed files, protected headers remain intact, the documentation route is retained, primary actions remain authentication-aware, the browse action targets `/pricing`, the terminal keeps its tabs and reduced-motion behavior, and the capability strip uses responsive bordered grid separators.

## Concerns

- New i18n source keys intentionally have no locale JSON entries yet; Task 5 owns those translations.
- The pre-existing `.superpowers/` directory is untracked and ignored by `.superpowers/sdd/.gitignore`; this report is not part of the commit.

## Review Fix

- Removed `tokens` and `latency` from `ApiDemoConfig` and all demo entries, removed simulated usage values and the numeric cost/latency/token footer, and replaced the footer with `route matched` and `stream · sse`.
- `cd web/default && bun run typecheck`: passed; `$ tsgo -b` exited 0.
- `cd web/default && bunx oxlint -c .oxlintrc.json src/features/home/components/sections/hero.tsx src/features/home/components/hero-terminal-demo.tsx src/features/home/components/sections/stats.tsx`: passed; no diagnostics; exited 0.
- `git diff --check`: passed; exited 0.
- Terminal regression assertion for forbidden numeric demo fields/content and required routing status: passed; exited 0.

## Review Fix 2

- Commit: `6ddb371b` (`fix(web): make hero terminal tabs responsive`).
- Hid the routed-status block below `sm`, reduced only mobile tab strip spacing, preserved desktop spacing with `sm:` overrides, and added non-wrapping shrink-safe tabs with horizontal scrolling fallback.
- `cd web/default && bun run typecheck`: passed; `$ tsgo -b` exited 0.
- `cd web/default && bunx oxlint -c .oxlintrc.json src/features/home/components/sections/hero.tsx src/features/home/components/hero-terminal-demo.tsx src/features/home/components/sections/stats.tsx`: passed; no diagnostics; exited 0.
- `git diff --check`: passed; exited 0.
- Responsive class regression assertion for `overflow-x-auto`, `whitespace-nowrap`, mobile `hidden`, and `sm:flex`: passed; exited 0.
- 390px class arithmetic inspection: available tab content `334px` after hero and tab-strip padding; estimated four-tab width `300px`; overflow fallback `false`; routed status `hidden below sm`.

## Review Fix 3

- Added `aria-pressed={isActive}` to each hero terminal demo-selection button without changing visuals or behavior.
- `cd web/default && bun run typecheck`: passed; `tsgo -b` exited 0.
- `cd web/default && bunx oxlint -c .oxlintrc.json src/features/home/components/hero-terminal-demo.tsx`: passed; no diagnostics; exited 0.
- `git diff --check`: passed; exited 0.
