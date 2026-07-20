# Xingluo Visual Alignment Design

## Goal

Make the Zhiqing model service platform read as a product within the Xingluo ecosystem while preserving its existing information architecture, business pages, interactions, and observability features.

## Scope

The first iteration changes only the authenticated application's global shell and shared theme tokens:

- Replace the compact header brand with the supplied Xingluo logo, a divider, and the text `智擎模型服务平台`.
- Use the supplied mesh image as a non-interactive decoration at the right side of the header.
- Increase the authenticated header height from 48px to 72px.
- Hide the global search entry by default to match the Xingluo header.
- Present desktop top-level navigation as Xingluo-style text tabs without changing routes, permissions, or the mobile menu.
- Introduce a Xingluo theme preset using the reference platform's blue primary color, pale gray-blue canvas, white surfaces, light blue borders, restrained shadows, and a 14px card radius.
- Make Xingluo the default preset while retaining the existing light/dark mode and user theme controls.
- Keep the current sidebar, navigation hierarchy, tables, charts, monitoring pages, dialogs, and responsive behavior.

Public pages and authentication pages receive the shared default theme tokens. When a user is authenticated, public content pages reuse the Xingluo application header so navigation between the dashboard, home page, and model square does not replace the full-width blue bar. Unauthenticated visitors keep the existing public header, sign-in controls, and authorization prompts. No backend API, database, authorization, or routing behavior changes.

## Visual System

### Header

- Height: 72px.
- Background: Xingluo blue, with enough contrast for white branding and controls.
- Left brand lockup: supplied Xingluo logo at 40px high, a 1px translucent white divider, then `智擎模型服务平台` in white.
- Right decoration: supplied mesh image, anchored to the top-right, non-repeating, pointer-events disabled, and placed behind navigation controls.
- The global search entry is hidden by default, while the existing component and `showSearch` override remain available for future page-specific use.
- Wide-screen navigation uses accessible pale-blue inactive items, white on hover, and a white semibold active item with a 2px underline. Below 1536px, the existing dropdown avoids collisions with branding and header controls. Navigation routes and permissions remain unchanged.
- Notifications, language, theme, and profile controls remain functionally unchanged and receive light-on-blue foreground and hover states.
- On narrow screens, the logo scales down and the product name truncates before any action controls overlap.

### Public Content Pages

- Authenticated users see the same `AppHeader` on the home page, model square, model details, rankings, and other pages hosted by `PublicLayout`.
- The shared header hides its sidebar trigger outside `AuthenticatedLayout`, because public content pages do not have a sidebar provider.
- Unauthenticated visitors continue to use `PublicHeader`; its sign-in button, access prompt, mobile overlay, and public navigation behavior remain unchanged.
- Page content, route guards, dynamic navigation configuration, and permissions are not moved or duplicated.

### Theme Tokens

- Primary: `#2563eb`.
- Canvas: `#f0f4f8`.
- Surface/card: `#ffffff`.
- Card and structural border: light blue near `#dbeafe`.
- Main text: near `#1f2937`; muted text near `#6b7280`.
- Shared radius: 14px for cards, with derived smaller radii for controls.
- Shadow: subtle neutral blue-gray shadow comparable to `0 1px 6px rgba(15, 23, 42, 0.03)`.
- Charts keep multiple semantic colors; only their primary series follows Xingluo blue.
- Dark mode remains supported with existing dark tokens rather than forcing a blue monochrome dark theme.

## Implementation Boundaries

Expected changes are limited to:

- Copying the two supplied assets into the default frontend's public assets.
- Adding a `xingluo` theme preset and making it the default.
- Adjusting the authenticated header and inline system brand presentation.
- Changing only the shared header's default search visibility and scoped desktop navigation classes.
- Allowing `PublicHeader` to reuse `AppHeader` for authenticated users while suppressing the sidebar trigger.
- Applying the shared canvas, surface, border, radius, and header foreground tokens.

The implementation must not introduce Xingluo-specific styles into individual feature pages. This keeps future upstream merges focused on a small set of shared shell files.

## State And Compatibility

- Existing users who explicitly selected another theme keep that choice.
- Users without a theme cookie receive the Xingluo preset.
- Authentication changes during a browser session must switch between the guest public header and the shared application header without violating React hook ordering.
- The system name configured by the backend remains unchanged; only the authenticated header uses the fixed product label.
- Missing image assets must degrade to the text product label without blocking navigation.

## Verification

- Build and type-check `web/default`.
- Verify desktop widths at 1440px and 1920px and mobile width at 390px.
- Check header contrast, control hover/focus states, sidebar positioning under the 72px header, and absence of overlap.
- Check representative pages: overview, usage logs, operations dashboard, service monitoring, resource monitoring, and conversation audit.
- While authenticated, navigate between dashboard, home, model square, and a model details page and confirm the full header bar does not change.
- While unauthenticated, confirm the public header and sign-in flow remain available.
- Deploy only to port 7992 for review; leave production port 7990 unchanged.

## Acceptance Criteria

- The first viewport clearly presents `星罗·数场 | 智擎模型服务平台` as one brand system.
- Existing features and navigation remain unchanged.
- The global header has no search control, and the active desktop navigation item is unambiguous without using pill-shaped buttons.
- Authenticated navigation between application and public content routes preserves one continuous Xingluo header.
- Most page-level visual alignment comes from shared tokens, not feature-specific CSS.
- No content overlaps at desktop or mobile widths.
- Port 7992 can be reviewed independently before any production rollout.
