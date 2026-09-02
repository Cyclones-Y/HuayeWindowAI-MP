# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

华业门窗 (Huaye Windows) AI 效果预览 — a **native WeChat Mini Program written in TypeScript**. Users upload a photo of their home, draw a box around the window, pick a producible window solution, view a before/after render, and book an on-site measurement. V1 is a clickable prototype: all backend behaviour (login, upload, AI render, lead submission) is mocked locally and never leaves the device.

UI copy, docs, and commit messages are in Chinese (`feat(miniprogram): ...` style). Keep new copy in plain Chinese aimed at non-expert homeowners.

## Commands

```powershell
npm install
npm run typecheck        # tsc --noEmit — the only automated check; there is no lint, test, or build script
```

There is no CLI build. The WeChat DevTools compiles `.ts` directly via `useCompilerPlugins: ["typescript"]` in `project.config.json`, so `.ts` files sit beside their `.wxml/.wxss/.json` and are never transpiled into a `dist/`. Open the repo root as the project in WeChat DevTools (README shows `cli.bat open --project <path>`).

To exercise the render-failure path, compile the page directly in DevTools with the query `pages/generating/index?fail=1`.

`tsconfig.json` is strict with `noUnusedLocals` / `noUnusedParameters`, so unused imports fail typecheck.

## Architecture

### Page flow and shared draft state

Tab pages: `pages/home`, `pages/solutions`, `pages/profile` (rendered with `custom-tab-bar/`; each tab page calls `this.getTabBar?.()?.setData({ selected: n })` in `onShow`).

Linear task flow: `home → upload → selection → solution-select → confirm → generating → result → appointment`.

Pages do not pass data via URL params. Everything flows through a single `DraftState` stored in `app.globalData.draft` and accessed only through `store/session.ts` (`getDraft`, `updateDraft`, `resetDraft`). Each flow page guards in `onLoad`: if the draft lacks what it needs (photo, solution, taskId…) it toasts and `wx.navigateBack()`s. When adding a step, follow this pattern rather than adding query strings. Entry points (`home.goUpload`, `trySample`, `onSolutionSelect`) call `resetDraft()` first.

Persistent local records (history, favourites, leads) live in `wx.setStorageSync` under `huaye_demo_*` keys, capped at 20 items, also via `store/session.ts`. `pages/result` locates its render by matching `draft.taskId` against history, so `saveHistory` must run before redirecting to result.

### Backend boundary: `FrontendGateway`

`services/gateway.ts` declares the `FrontendGateway` interface (login, listSolutions, createRenderTask, getRenderTask, favoriteSolution, submitLead, clearUserData). `services/index.ts` exports the single `gateway` instance, currently `MockGateway` from `services/mock-gateway.ts`. Pages import `gateway` and never touch the implementation, so a real HTTP gateway is added by implementing the interface and swapping the export in `services/index.ts`.

`MockGateway` simulates an async render task purely by elapsed time (QUEUED → PROCESSING → SUCCEEDED at ~3.6 s; `forceFailure` fails at 1.8 s). `pages/generating` polls `getRenderTask` every 650 ms. `RenderStatus.DRAFT` is a client-only state and must never be treated as a server status.

`docs/backend-api.md` is the agreed contract for the future Spring Boot backend. Its section 14 (“前端联调改造清单”) lists exactly what the frontend must change during integration (e.g. send `solutionId` not the full `WindowSolution`, submit normalized `selection`, replace favourite toggle with PUT/DELETE, replace `isDemo: true` literal with `resultType`). Consult it before changing `types/index.ts` or gateway signatures.

### Data and assets

- `data/solutions.ts` is the static catalogue of the three producible solutions and the only source of `WindowSolution` objects. `MockGateway.listSolutions` returns it verbatim.
- Solution and hero imagery lives in `assets/generated/` and is referenced by absolute `/assets/...` paths. `assets/cases/` and `assets/generated/prompts/` are excluded from the uploaded package via `packOptions.ignore` in `project.config.json`, so do not reference them at runtime.
- Selection coordinates are normalized `0–1` `NormalizedRect`s relative to the image; `pages/selection` converts from the measured stage rect and rejects boxes under 8 % of the area.

### Components and styling

- `components/solution-card` is the only shared component (props `solution`, `selected`, `compact`; emits `select` with `{ id }`). Register it per page in `index.json` under `usingComponents`.
- `app.wxss` holds the shared layout/button/form classes (`.page-shell`, `.with-action-bar`, `.tab-page`, `.action-bar`, `.primary-button`, `.secondary-button`, `.form-*`, `.demo-badge`, `.empty-state`). Reuse these before adding page-local equivalents.

## Design and product constraints

`DESIGN.md` is the authoritative design system (tokens in its frontmatter) and `PRODUCT.md` the product boundary. The rules that most often affect code changes:

- **Layout**: Flexbox only, no CSS Grid. Base horizontal padding 32rpx, spacing in 8rpx multiples. Fixed bottom bars add `env(safe-area-inset-bottom)`.
- **Sizing**: primary touch targets ≥ 88rpx; standard buttons 104rpx tall; inputs 96rpx.
- **Radii**: buttons 28rpx, inputs/chips/panels 24rpx, cards and image crops 16rpx, small tags 14rpx. No full pill shapes.
- **Colour**: deep green `#244233` is reserved for the primary action and selected state on a screen; clay orange `#C07048` only for small markers; no gradients, glassmorphism, or nested cards. Flat by default; shadows only on interactive emphasis.
- **Type**: system Chinese sans-serif stack, zero letter-spacing, no remote web fonts.
- **Motion**: press feedback animates only `transform`/`opacity` over ~160 ms.
- **Copy**: the UI is written as a production app. Do not use 演示 / 体验版 / 测试 / 本机 wording anywhere in user-facing copy (decided 2026-09-02). “尺寸、价格与施工方式以上门量尺为准” must stay visible. Never invent customer testimonials, case counts, prices, service areas, or accuracy figures; none exist yet.
- Home hero and before/after comparisons must use the same-scene image pairs in `assets/generated/`; never crop old screenshots or reference mockups into UI assets.
