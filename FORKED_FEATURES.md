# Flowise Forked Features

This document tracks changes and additions made in this fork relative to upstream Flowise.

## Async + polling chat delivery for embeds
- Added an async prediction mode on the server that returns `202 Accepted` immediately and continues processing in the background.
  - Implemented in `packages/server/src/controllers/predictions/index.ts`.
  - Request shape includes `async: true`; server ensures `chatId` is set and disables streaming for async requests.
- Embed client can poll for updates instead of holding long-lived requests.
  - New embed config option: `usePolling?: boolean`.
  - Default embed config sets `usePolling` to `true` for both web.js and web.umd.js bundles.
  - When enabled, the widget posts `async: true`, then polls `/api/v1/public-chatmessage/:chatflowid` using the existing `sessionId` or `chatId`.
  - If a `sessionId` is available, the widget also polls `/api/v1/public-executions/by-session` to surface agentflow progress data during the async run.
  - Agentflow progress is injected into an `apiMessage` placeholder when the final response has not been saved yet.
  - UI history is updated on each poll and stored to the same external local storage key, preserving session continuity.
  - Implemented in `node_modules/flowise-embed/dist/web.js` and `node_modules/flowise-embed/dist/web.umd.js`.
  - Typings updated in `node_modules/flowise-embed/dist/web.d.ts`, `node_modules/flowise-embed/dist/window.d.ts`, and `node_modules/flowise-embed/dist/components/Bot.d.ts`.
  - Patch files updated so `pnpm` patchedDependencies keep these changes:
    - `patches/flowise-embed.patch`
    - `patches/flowise-embed@3.0.5.patch`
- Public execution polling endpoint for agentflow progress.
  - New route: `/api/v1/public-executions/by-session?chatflowId=...&sessionId=...`.
  - Mirrors public chat history rules (chatHistory enabled + allowed origins).
  - Implemented in `packages/server/src/controllers/executions/index.ts`, `packages/server/src/services/executions/index.ts`, and `packages/server/src/routes/public-executions/index.ts`.

## Tests added for forked behavior
- Async prediction route test ensures `202` + `chatId`/`sessionId` response:
  - `packages/server/test/routes/v1/predictions.route.test.ts`
  - Registered in `packages/server/test/index.test.ts`
- Embed history test now validates `usePolling` config exposure and bundle content:
  - `packages/components/src/__tests__/flowise-embed-history.test.ts`
- Custom MCP bundle test ensures `$flow` substitutions are compiled into the dist artifact:
  - `packages/components/src/__tests__/custom-mcp-flow-vars.test.ts`
- Public execution polling route coverage:
  - `packages/server/test/routes/v1/public-executions.route.test.ts`
  - Registered in `packages/server/test/index.test.ts`

## Agentflow Custom MCP supports $flow variables in config
- MCP server config templating now supports `{{ $flow.* }}` in addition to `{{ $vars.* }}`.
  - Exposes session and flow identifiers like `sessionId`, `chatId`, `chatflowid`/`chatflowId`, plus `input`, `state`, and `apiMessageId` when present.
  - Implemented in `packages/components/nodes/tools/MCP/CustomMCP/CustomMCP.ts`.

## Embed asset divergence (upstream vs fork)
- Upstream `flowise-embed@3.0.5` bundle:
  - Full‑page fallback height uses `100dvh`.
  - Does not include `includeHistory`/`usePolling` or public chat polling references.
- Forked embed bundle (`node_modules/flowise-embed/dist/web.js`) differs:
  - Adds `includeHistory` and `usePolling` support.
  - Uses `/api/v1/public-chatmessage` polling path.
  - Persists `sessionId` in external chat history and scopes storage by `_EXTERNAL_`.
  - Full‑page fallback height uses `auto`.
