# Zhiqing Homepage Redesign

## Goal

Redesign the default homepage so it introduces the platform's real capabilities and clearly presents Zhiqing as the model-service component of Xingluo. The page remains a product capability overview for internal users rather than becoming another dashboard.

The primary brand expression is `星罗数场 · 智擎模型服务平台`.

## Scope

This iteration replaces the generic upstream homepage copy and presentation with a Zhiqing-specific narrative while preserving the existing homepage override behavior:

- If an administrator configures custom homepage Markdown, HTML, or a URL, that content continues to take precedence.
- The redesigned page is rendered only when no custom homepage content is configured.
- Existing routes, authentication, permissions, backend data models, and navigation remain unchanged.
- Changes stay primarily inside `web/default/src/features/home`, plus the required frontend locale files.
- Deployment and review are limited to port 7992. Port 7990 remains unchanged.

## Page Structure

### 1. Hero

The first viewport identifies the product and its role inside Xingluo.

- Eyebrow: `星罗数场大模型服务组件`.
- Brand identity: `星罗数场 · 智擎模型服务平台` remains visible in the shared header.
- Main statement: `统一接入、调度与治理每一项模型能力`.
- Supporting copy explains that Zhiqing serves internal business applications by managing multi-node local models and multi-channel model services through unified protocols, stable routing, observability, and governance.
- Authenticated primary action: enter the dashboard.
- Guest primary action: sign in or register according to the current authentication configuration.
- Secondary action: browse the model square.
- The existing API terminal demonstration remains, but its examples use the platform's actual model-service vocabulary and local-model routing scenario.
- The hero uses the Xingluo blue, white, and pale gray-blue visual system. It does not add decorative gradient orbs.

### 2. Capability Strip

A compact four-column strip immediately below the hero communicates the platform's boundaries without presenting volatile numbers:

1. Multi-node unified management.
2. Multi-protocol compatible access.
3. Full-link monitoring and analysis.
4. Request-path audit.

Each item includes one short explanation. On narrow screens, the strip becomes a two-column grid and then a single column if necessary.

### 3. Core Capabilities

The generic upstream feature list is replaced with six concrete Zhiqing capabilities:

1. Unified model gateway.
2. Local model deployment and access.
3. Multi-channel intelligent routing.
4. Service status monitoring.
5. Host, GPU, and vLLM engine monitoring.
6. Call analysis and request-path audit.

The section uses a quiet three-column capability grid with icons, concise titles, and one-sentence descriptions. It avoids nested cards and marketing-only claims. It becomes two columns on tablet and one column on mobile.

### 4. Platform Operation Overview

This section is visible only to authenticated users. It is a lightweight summary, not a duplicate of the operations dashboard.

The four summary values are:

- Available models: count returned by the current user's `/api/user/models` response.
- Requests in the last 24 hours: sum of `count` from `/api/data/self` for the current user.
- Tokens in the last 24 hours: sum of `token_used` from the same user-scoped response.
- Platform call success rate: request-count-weighted success rate from `/api/perf-metrics/summary?hours=24`. The existing summary response exposes each model's aggregate `request_count` so the frontend can calculate a mathematically correct weighted result. The label explicitly says platform success rate so it cannot be mistaken for the current user's private success rate. If there are no requests in the period, the value is 100%.

Below the values, a small hourly request trend is derived from `/api/data/self`. A compact service-status summary is derived from `/api/uptime/status` and reports normal services versus total enabled services. It links to the full service-monitoring page rather than reproducing its timeline.

The data remains permission-safe:

- User usage data comes only from the existing self-scoped endpoint.
- Available models are filtered by the current user's group and permissions by the existing endpoint.
- Platform success and service availability use endpoints already available to authenticated users and do not reveal usernames, API keys, channel secrets, request bodies, or audit records.
- Administrator-only user and channel counts are not placed on the homepage.

### 5. Access Flow

The old three-step generic flow becomes a four-step platform flow:

1. Connect resources.
2. Configure channels.
3. Call through the unified API.
4. Monitor and govern.

The copy describes the lifecycle without exposing administrator-only actions to ordinary users as clickable commands. The section is explanatory; navigation remains permission-aware elsewhere in the application.

### 6. Closing Action

The final full-width band reinforces the operational purpose of the platform:

- Statement: model capabilities should serve every business scenario reliably.
- Primary action: enter the dashboard for authenticated users; sign in or register for guests.
- Secondary action: open API documentation or browse models according to the existing configured documentation link.
- The existing footer and protected upstream attribution remain intact.

## Component Design

The homepage keeps the current section-based composition, with focused responsibilities:

- `Hero`: brand statement, primary actions, and API demonstration.
- `Stats`: becomes the static four-item capability strip.
- `Features`: renders the six real platform capabilities.
- `OperationOverview`: new authenticated-only section responsible for querying and presenting lightweight operational data.
- `HowItWorks`: renders the four-step access flow.
- `CTA`: renders the closing action for both guest and authenticated states.

`Home` remains responsible for custom-content precedence and for composing these sections. Data fetching is isolated inside `OperationOverview` so a monitoring or usage request cannot block the hero or the rest of the homepage.

## Data Flow And Formatting

`OperationOverview` issues its independent queries through TanStack Query and reuses the existing API wrappers where available.

- Query stale time is at least 60 seconds for 24-hour usage and monitoring summaries.
- Requests execute only when the user is authenticated.
- Hourly timestamps are formatted through the project's locale helpers and must use a valid BCP 47 locale. The implementation must never pass internal locale identifiers such as `zhCN` directly to `Intl`.
- Large counts use the existing localized number formatter. Tokens use compact display units with a precise value available in tooltip or accessible text.
- Percentages are bounded to 0-100 and displayed with at most two decimal places.
- The success-rate weighted average ignores models without request counts. An empty period displays 100%, matching the platform's established operations-dashboard semantics.

## Loading And Failure States

- The hero, capability sections, flow, and footer render immediately and never wait for operational queries.
- While dynamic data loads, fixed-height skeletons preserve layout dimensions.
- A failed query affects only its corresponding value or chart.
- Failed values display `--`, not fabricated zero values.
- The section provides a small retry action only when every dynamic query fails.
- Partial data remains visible when one source is unavailable.
- Empty successful responses display valid zero counts; an empty success-rate period displays 100%.

## Responsive And Accessibility Requirements

- The shared Xingluo header remains unchanged across the homepage, dashboard, and model square.
- The first viewport leaves a visible hint of the capability strip on common desktop and mobile sizes.
- Text and terminal content must not overlap from 390px through 1920px widths.
- The API demonstration is reduced or moved below the copy on small screens without horizontal overflow.
- Buttons remain keyboard reachable and retain visible focus styles.
- Icons are decorative unless they convey unique meaning; decorative icons are hidden from assistive technology.
- Motion respects `prefers-reduced-motion`.
- Dark mode remains functional through shared theme tokens.

## Internationalization

All new user-facing strings use `useTranslation()` with English source keys. Locale entries are added for English, Chinese, French, Russian, Japanese, and Vietnamese using the project's i18n tooling. Chinese product names remain exact where they are protected brand expressions; explanatory text is translated normally.

## Compatibility And Upstream Merge Strategy

The implementation avoids backend schema changes and new APIs. It reuses current endpoints; the existing performance-summary response adds only the already-computed aggregate `request_count` field, without exposing user-level data. Frontend changes stay concentrated in the existing homepage feature directory. Shared layout, routing, monitoring pages, and dashboard pages are not modified.

This boundary reduces future merge conflicts with upstream homepage work to a small, identifiable set of frontend files. Protected references and attribution related to new-api and QuantumNous are retained.

## Verification

- Run the default frontend type check and production build with Bun.
- Run i18n validation and confirm every new key exists in all supported locales.
- Add deterministic component tests for authenticated and guest composition, success-rate aggregation, empty periods, partial failures, and locale-safe time formatting.
- Verify the custom homepage Markdown, HTML, and iframe paths still bypass the default redesign.
- Check desktop viewports at 1440px and 1920px and mobile at 390px using browser screenshots.
- Verify the first viewport, responsive stacking, tooltips, focus states, dark mode, and reduced-motion behavior.
- Verify ordinary users receive only self-scoped usage data.
- Deploy the reviewed build to port 7992 and leave port 7990 untouched.

## Acceptance Criteria

- The homepage clearly presents `星罗数场 · 智擎模型服务平台` as one product identity.
- The main headline and capability list describe the actual customized platform rather than generic upstream features.
- Internal users can understand what the platform does before entering the dashboard.
- Authenticated users see a lightweight, correctly scoped 24-hour operation overview; guests do not trigger protected data requests.
- Empty and failed data states are unambiguous and do not produce misleading zero percentages.
- Navigation, custom homepage overrides, permissions, and protected upstream attribution continue to work.
- The page is visually consistent with the Xingluo header and shared theme at desktop and mobile sizes.
- The reviewed implementation runs on port 7992 without affecting port 7990.
