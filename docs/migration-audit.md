# Migration audit (Phase 0)

Audit for [migration-plan.md](./migration-plan.md), as of 2026-11-20.

## Routes

All routes live in `src/App.tsx`. `/embed/insights/:chartId` sits outside the app chrome; everything else is nested under `/*` with the header.

| Path                                                                                                       | Param format                       | Class                                                                |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `/`                                                                                                        |                                    | Prerender                                                            |
| `/characters`, `/characters/:id`                                                                           | string id (wiki slug)              | Prerender                                                            |
| `/arcs`, `/arcs/:id`                                                                                       | string `arc_id`                    | Prerender                                                            |
| `/sagas`, `/sagas/:id`                                                                                     | string `saga_id`                   | Prerender                                                            |
| `/chapters`, `/chapters/:number`                                                                           | integer                            | Prerender                                                            |
| `/volumes`, `/volumes/:number`                                                                             | integer                            | Prerender                                                            |
| `/affiliations`, `/affiliations/:groupName`                                                                | free text (URL-encoded group name) | Prerender                                                            |
| `/occupations`, `/occupations/:role`                                                                       | free text (URL-encoded role)       | Prerender                                                            |
| `/devil-fruits`                                                                                            |                                    | Prerender (list only, see gaps)                                      |
| `/world-top-100`, `/about`, `/changelog`                                                                   |                                    | Prerender                                                            |
| `/analytics` and `/analytics/{bounty,appearances,story,demographics,characters,affiliations,data-quality}` |                                    | Prerender                                                            |
| `/analytics/{network,story-graph,character-timeline,word-cloud,appearance-race}`                           |                                    | Client-only (vis-network, d3-cloud, canvas)                          |
| `/analytics/{chapter-releases,release-predictor}`                                                          |                                    | Prerender shell, charts client-side                                  |
| `/analytics/character-compare`                                                                             |                                    | Client-only                                                          |
| `/timeline`                                                                                                |                                    | Client-only (vis-network)                                            |
| `/games`, `/games/*` (5 games)                                                                             |                                    | Client-only (localStorage, `Math.random`, `Date.now`)                |
| `/chat`                                                                                                    |                                    | Client-only (auth)                                                   |
| `/embed/insights/:chartId`                                                                                 | slug                               | Noindex, client-only                                                 |
| 10 legacy `/analytics/*` paths                                                                             |                                    | `<Navigate>` redirects; candidates for Cloudflare `_redirects` (301) |

## Gaps against the plan

- **There is no devil fruit detail route.** The plan expects one prerendered page per devil fruit, so a `/devil-fruits/:id` page has to be built first (Phase 2 or 3).
- Affiliation and occupation params are free text with spaces and punctuation. Prerendered file names must use the same encoding as the links (`encodeURIComponent`).

## Row counts

Measured 2026-11-20 by `scripts/fetch-build-data.ts`: 1,469 characters, 33 arcs, 11 sagas, 1,198 chapters, 115 volumes, 342 affiliations, 669 occupations, 134 devil fruits. With list and analytics pages this is 3,992 prerendered pages, about 12,000 files including `.data` files and OG cards, under the 20,000-file limit of Workers static assets on the free plan.

## Browser-only code (Node prerender risks)

Nothing touches `window`, `document` or `localStorage` at module scope. `src/main.tsx` calls `document.getElementById`, but it is replaced by `root.tsx` in framework mode. The rest are runtime uses that fail only if they run during render:

| Where                                                                     | What                                                 | Fix in Phase 2                                           |
| ------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| `hooks/usePersistedState.ts` (used by `CharactersPage`, `CharacterTable`) | `localStorage` in `useState` initializer             | Hydration mismatch: read in `useEffect`, or `ClientOnly` |
| `pages/MysteryCharacterPage.tsx`                                          | `Math.random()` seed, `localStorage`                 | Client-only route                                        |
| `components/namethemall/NameThemAllRound.tsx`                             | `Date.now()` in state initializer                    | Client-only route                                        |
| `components/common/ChartCard.tsx`                                         | `window.location.origin` during render for permalink | Compute in handler, or use a `SITE_URL` constant         |
| `components/{quiz,whoami,arcquiz,namethemall}/*Result.tsx`                | `window.location.origin` during render               | Client-only routes                                       |
| `pages/*DetailPage.tsx` share buttons                                     | `window.location.href`, `navigator.clipboard`        | Inside click handlers, safe                              |
| `pages/analytics/*TopicPage.tsx`, `App.tsx` `ScrollToHash`                | `window.location.hash`, `document`                   | Inside `useEffect`, safe                                 |
| `services/auth.ts`                                                        | `window.location`                                    | Inside function, safe                                    |

DOM libraries imported at module scope: `vis-network/standalone` (NetworkAnalysisPage, StoryTimeline, StoryGraphView, AffiliationNetworkGraph), `d3-cloud` (word cloud), `html-to-image` and `gifenc` (share/export). Load these lazily or behind `ClientOnly`. Sigma.js and Graphology are not used, although `CLAUDE.md` lists them.

## Data access

Pages call TanStack Query with functions from `src/services/*`, but several detail pages define fetchers inline. For example, `fetchCharacterById` and `fetchSagas` live in `CharacterDetailPage.tsx`. Move these into services before writing loaders so loaders and components share one function. The Supabase client (`services/supabase.ts`) reads `import.meta.env` and is safe to import in Node.

## Other findings

- **`netlify.toml` is not unused.** Production builds are skipped, but it builds a deploy preview for every PR. Remove it only when Cloudflare preview deploys replace it (`wrangler versions upload` per PR). Kept for now.
- **Supabase auth:** Google OAuth redirects to `window.location.origin + pathname`. Add the `workers.dev` URL, and later the custom domain, to the Supabase Auth redirect allowlist, or sign-in breaks there.
- `public/CNAME` must stay until DNS cutover, since GitHub Pages still serves the domain.

## Baseline

- Bundle: entry `index-*.js` 676 kB (200 kB gzip), `vis-network` chunk 645 kB (155 kB gzip). The 300 KB initial-load target in `CLAUDE.md` is already exceeded.
- Lighthouse: TODO, run on home and one character page before Phase 2.
