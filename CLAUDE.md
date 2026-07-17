# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

VideoPapel — a Next.js frontend that turns uploaded videos into printable flipbooks ("videos de papel"): the user picks frames from a video clip, styles them (frames, text, logos, page numbers), and orders a printed product. All persistence, media processing and PDF generation live in a **separate Django/DRF backend** (default `http://localhost:8000`); this repo is UI only.

**UI copy, comments, and error messages are in Spanish.** Match that when adding user-facing strings.

## Commands

```bash
npm run dev        # next dev --turbopack, port 3000
npm run build      # next build --turbopack
npm run lint       # eslint (next/core-web-vitals + next/typescript)
npx tsc --noEmit   # typecheck — NOT run by the build, see below
npm test           # vitest run — all tests once (CI/verify)
npm run test:watch # vitest — watch mode
npm run test:ui    # vitest --ui — browser UI
./deploy-vercel.sh {unionlocal|papel}   # prod deploy, needs ~/.vercel-tokens
```

Tests run on **Vitest + Testing Library** (jsdom). See the `## Testing` section below for conventions. `npm test` is **not** wired into `npm run build` or the deploy script — run it explicitly.

`npm run gen:api` runs `openapi-typescript-codegen` against the backend's live schema at `http://localhost:8000/api/schema/`, writing to `src/lib/api`. **That directory does not exist and its output has never been committed** — the whole codebase is hand-written fetch calls. Running it would create `src/lib/api/` alongside the existing `src/lib/api.ts` module; don't run it casually.

### The build hides errors

`next.config.ts` sets both `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors`. A green `npm run build` means nothing about type or lint health. Run `npx tsc --noEmit` and `npm run lint` explicitly to verify a change. Note `npx tsc --noEmit` currently reports **pre-existing** errors in several unrelated files (e.g. `profile/page.tsx`, `DuplicateProjectButton.tsx`, `MyClips.tsx`, `IconsTiles.tsx`) — that's the known baseline the ignored build papers over, not something your change introduced. Check that your touched files are clean rather than expecting a zero-error run.

## Testing

**Stack:** Vitest + `@testing-library/react` + `@testing-library/user-event` + `jest-dom`, environment `jsdom`. Config in `vitest.config.ts`, setup in `vitest.setup.ts` (imports `jest-dom` matchers + `cleanup()` after each test). There is **no** Jest — don't add it.

- **Test files are co-located** next to the code they cover: `foo.ts` → `foo.test.ts`, `Bar.tsx` → `Bar.test.tsx`. `include` glob is `src/**/*.{test,spec}.{ts,tsx}`.
- `globals: true` — `describe/it/expect/vi` are available without imports, but the existing tests import them explicitly; match that.
- **Env vars for tests live in `vitest.config.ts`** under `test.env` (`NEXT_PUBLIC_API_BASE` + `NEXT_PUBLIC_API_BASE_URL` = `http://localhost:8000`). This is mandatory because `lib/env.ts` **throws at import time** if no base URL is set, and it's imported transitively by `store/auth.ts`, `lib/http.ts`, etc. If a new test's import chain touches `lib/env.ts` and there's no base, the whole file fails to load — the env block is what prevents that.
- The `@/*` alias resolves natively via `resolve.tsconfigPaths: true` (no `vite-tsconfig-paths` plugin).

### Mocking patterns (match the HTTP path of the code under test)

The three HTTP paths from the architecture table each mock differently:

- **raw `fetch` code** (dominant pattern, and `lib/http.ts`/token-route wrappers that call `fetch` directly) → `vi.stubGlobal('fetch', vi.fn().mockResolvedValue(...))`. Build fake responses as `{ ok, status, statusText, json: async () => data, text: async () => '...' }`. For a component that both GETs and PATCHes (e.g. a `*Selector`), route the mock on `init?.method`.
- **`lib/api.ts` `apiFetch` code** (the `lib/*Invitations.ts` / `companyGuestAccess.ts` wrappers, which get a **raw `Response`** back) → `vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }))` then `vi.mocked(apiFetch).mockResolvedValue(res as Response)`. Don't stub global fetch for these.
- **zustand stores** are module singletons: reset with `useAuth.setState({...})` / `useLoading.setState({ pending: 0 })` in `beforeEach`, and `localStorage.clear()` for the persisted auth store. Call actions via `useStore.getState().action()`.

### Component patterns

- Heavy children that self-load data (e.g. `ProjectEditor` inside `ProjectEditorGate`) → **stub via `vi.mock`** so the test targets only the unit under test. Same for `next/navigation` (`notFound`, `useRouter`).
- Assert on **user-visible output**: `getByText`, `getByLabelText`, `findBy*` for async. Only reach into `className`/attributes when the behavior genuinely is visual (e.g. the color tier in `PrintQualityBadge.test.tsx`).
- Interaction tests use `userEvent.click(...)` + `waitFor`/`findBy*`. See `OrientationSelector.test.tsx` for the load→select→PATCH→callback (and error-revert) flow.
- **Hooks that expose async actions** (`useProjectPdfExport`, etc.) → test with `renderHook`. When asserting state (`result.current.error`, …) **after an action that rejects**, wrap the rejection assertion *inside* `act`: `await act(async () => { await expect(result.current.doThing()).rejects.toThrow(...) })`, then read `result.current`. If you leave `expect(...).rejects` outside `act` (e.g. `await expect(act(() => ...)).rejects`), React hasn't flushed the `setState` from the hook's `catch` when you read the result — the state still looks null. `useProjectPdfExport.test.ts` uses the correct pattern.

### Shared harnesses for clone components

Many `*Selector` components are structurally identical (GET options on mount → PATCH on pick → revert on error). Instead of near-duplicate test files, there's a parametrized harness at `src/test/selectorHarness.tsx` exposing `runRadioSelectorSuite(config)`; each radio-selector test (e.g. `QualitySelector.test.tsx`) is ~12 lines of config. The harness lives outside the `*.test` glob so it doesn't run on its own — it only executes when a test file imports it. Follow this pattern when adding tests for a new batch of clone components rather than copy-pasting the suite.

Two `next/navigation` mock notes that recur: use `vi.hoisted(() => ({ replace: vi.fn(), pathname: '/' }))` for mutable router/pathname refs (the object is safe to reference inside the hoisted `vi.mock` factory), and drive the fetch-monkey-patch in `AuthSessionGuard` with a minimal fake response (`{ status, clone: () => ({ json: async () => payload }) }`) plus `window.history.replaceState` to set `window.location.pathname`. See `AuthSessionGuard.test.tsx`.

### Coverage so far (good examples to copy)

`store/auth.test.ts`, `lib/http.test.ts` (DRF error normalization), `utils/time.test.ts`, `lib/spanishProvinces.test.ts`, `components/project/PrintQualityBadge.test.tsx` (presentational), `components/project/ProjectEditorGate.test.tsx` (hydration gate + mocked child), `lib/projectInvitations.test.ts` + `lib/companyGuestAccess.test.ts` (wrapper mocking), `components/project/OrientationSelector.test.tsx` (interaction).

## Architecture

### It's a client-side SPA wearing App Router

156 of 168 `.tsx` files are `'use client'`. There are no server components fetching data, no route handlers, no server actions. `src/app/*/page.tsx` files are thin shells that render a client component from `src/components/`. Data loading happens in `useEffect` in the browser, after auth hydration.

**React Query is installed and mounted (`components/Providers.tsx`) but never used** — `useQuery`/`useMutation`/`queryKey` appear zero times. Every fetch is a raw `fetch` with `useState`/`useEffect`. `src/lib/queryClient.ts` has no importers (`Providers` constructs its own client). Follow the existing manual pattern rather than introducing React Query for one component.

### Three overlapping HTTP paths (pick deliberately)

| Path | Base URL | Auth | Returns | Used by |
|---|---|---|---|---|
| `lib/http.ts` `apiFetch<T>` | `API_URL` from `lib/env.ts` | none | parsed JSON, throws `ApiError` | 3 files (password reset, rectification) |
| `lib/api.ts` `apiFetch` | `NEXT_PUBLIC_API_BASE` | Bearer + refresh-on-401 retry | raw `Response` | `ShareModal` + the `lib/*Invitations.ts` / `companyGuestAccess.ts` wrappers |
| raw `fetch` | `NEXT_PUBLIC_API_BASE` | hand-written `Authorization: Bearer` | raw `Response` | ~111 call sites, the dominant pattern |

Only `lib/api.ts` does token refresh. `lib/http.ts` is the only one that increments the global loading store (`store/loading.ts` → `GlobalSpinner`) and the only one that normalizes backend error shapes into a message (`buildErrorMessage` walks `detail`/`error`/first-field-array — DRF style). When touching a component, keep its existing helper unless you're deliberately migrating it.

### Env vars — two names for the same backend

- `NEXT_PUBLIC_API_BASE` — legacy, read directly by `lib/api.ts`, `useProjectPdfExport`, and most components.
- `NEXT_PUBLIC_API_BASE_URL` (+ `NEXT_PUBLIC_API_PREFIX`, default `/api/v1`) — read by `lib/env.ts`, which composes `API_URL` and **throws at import time if neither base is set**.

Both must be present in `.env.development.local` or the app breaks in different places. Also used: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_FAKE_LATENCY_MS` (artificial delay floor in `lib/http.ts`, for testing spinners).

### Auth

`src/store/auth.ts` is the real auth: a zustand `persist` store (localStorage key `videopapel-auth`) holding `accessToken`, `refreshToken`, and `user`.

It uses **`skipHydration: true`**, so `hasHydrated` gates everything. Reading `accessToken` before `hasHydrated` is true always yields `null` and will fire spurious redirects/fetches. Follow `ProjectEditorGate.tsx` — render a placeholder until `hasHydrated`, then decide.

`src/hooks/useAuth.ts` is **dead code with zero importers** — a parallel localStorage `access_token` implementation that contradicts the store. Same for `src/store/editor.ts` (a layers store nothing imports). Don't extend them; `import { useAuth } from '@/store/auth'` is the live one (35 importers).

`components/AuthSessionGuard.tsx` (mounted in the root layout) does two global things:
1. **Monkey-patches `window.fetch`** to inspect every 401 for a `token_not_valid` payload and force a logout + redirect to `/login?session_expired=1`. Any fetch anywhere is subject to this.
2. Client-side route protection from a hardcoded `PROTECTED_PATH_PREFIXES` array. **New authenticated routes must be added to that list** — there is no middleware and no server-side guard.

### Actors and access model

Beyond normal users, a project carries `current_user_role: 'owner' | 'edit' | 'view'` and `current_user_can_edit` / `current_user_can_manage_sharing` flags that drive UI gating. Three separate invitation flows, each with its own token route and `lib/` wrapper:

- `/invitations/[token]` → `lib/projectInvitations.ts` — share a project.
- `/event-invitations/[token]` → `lib/eventInvitations.ts` — events group projects.
- `/acceso/[token]` and `/invite/[accessId]` → `lib/companyGuestAccess.ts` — QR/temporary company-guest access; calls `setGuestSession()` to mint a session for a non-registered visitor (`account_type: 'company_guest'`).

### The editor (the core of the app)

`components/project/ProjectEditor.tsx` (~1460 lines) is the shell — loads the project, owns all print settings (quality, size, orientation, effect, aspect, binding, sheet paper, privacy), and renders selector/badge pairs. `components/project/EditingCanvas.tsx` (~1157 lines) is the frame-picking surface.

Domain model: **Project → clips → frames → thumbnails**. A clip is a video with `duration_ms`, `time_start_ms`/`time_end_ms` (trim), and `frames` — an array of **millisecond timestamps** that become printed pages.

Thumbnail sourcing is the subtle part (`hooks/useCombinedThumbs.ts`):
- Backend-generated thumbnails (worker → GCS/CDN) are preferred; missing ones fall back to **Cloudinary URL transformations built by string surgery** on the video URL (`utils/cloudinary.ts` splices `so_<secs>,c_scale,h_,f_jpg` after the `/video/upload/` segment).
- Frames snap to a grid whose **density is 1–8 thumbs/sec** (`MAX_DENSITY = 8`). Density changes re-derive the grid and re-snap frame times.
- Results are cached twice: localStorage (`utils/thumbCache.ts`, keys `vp:thumbs:<projectId>:<clipId>`) and IndexedDB (`utils/thumbsIndexedDb.ts`, DB `vp-thumbs-cache`). Both key off a **signature** from `buildSig()` (clipId, src, duration, count, height, framesVersion, `v: 4`). **Any change to how thumbnails are generated must bump the `v` in `buildSig`**, or users get stale cached frames.

PDF export lives in `hooks/useProjectPdfExport.ts`: `POST /projects/:id/export-pdf/` → `{ file }` URL, with `clean_output` and `print_style_preset_id` variants.

### Commerce flow

`/cart` → `/summary` → `/shipping` → `/invoice` → `/orders/[id]`, against `/cart/`, `/checkout/`, `/orders/`, `/shipping-addresses/`, `/company-addresses/`. Post-purchase problems go through `/order-issues/` and `/rectification-invoice` (`/order-issues/rectification-flow/`). Spanish invoicing specifics live in `lib/spanishProvinces.ts`.

## UI conventions

- **Tailwind v4, CSS-first.** There is no `tailwind.config.*` — the theme is `@theme inline` + oklch CSS variables in `src/app/globals.css`. Add design tokens there, not in a config file.
- shadcn/ui, **new-york** style, `rsc: true`, neutral base, aliases per `components.json`. Radix under `components/ui/`. Icons: `lucide-react`. Use `cn()` from `@/lib/utils`.
- **Reuse the house modal primitives** instead of raw Radix dialogs: `ui/Modal.tsx` (base), `ui/BaseTileModal.tsx` (the tile/option-picker grid behind most `*PickerModal`/`*Tiles` components), and `ui/ConfirmProvider.tsx` — confirmation is the promise-based `const confirm = useConfirm(); if (await confirm({...}))`, not `window.confirm`.
- Toasts: `sonner` (`import { toast } from 'sonner'`). Animation: `framer-motion`. Route progress bar: `TopProgress` (nprogress).
- Editor settings follow a consistent **`Print*Badge` (display) + `*Selector` (edit)** pair wrapped in `SelectableBadgeWrapper`. Adding a new print setting means following that pair.
- Decorative fonts are per-component in `src/fonts/` (borel, cookie, fascinate, pacifico) via `next/font`.

## Deploys

The same codebase ships to **two Vercel projects** — `unionlocal` and `papel` — selected by `./deploy-vercel.sh <target>`. The script rewrites `.vercel/project.json`, sets the local git author to match the target's account, and pushes an empty commit if the last author doesn't match (Vercel's "Git author must have access" check). Tokens come from `~/.vercel-tokens`, not the repo.
