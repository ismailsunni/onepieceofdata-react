# onepieceofdata.com: Cloudflare + prerendered SSG migration plan

Nov 19, 2026 · @Sunni

## Goal and success criteria

Move onepieceofdata.com from a hash-routed SPA on GitHub Pages to Cloudflare, with every entity page prerendered as real HTML, so it ranks in Google and shows rich previews when shared from @onepieceofdata.

Today the site (repo `ismailsunni/onepieceofdata-react`: React 19, Vite, React Router v7 with HashRouter, TanStack Query, Supabase) serves one near-empty `index.html`. Every URL lives after `#`, so crawlers and link-preview bots see only the homepage.

Done means:

- Clean URLs (`/characters/<id>`, no `#`), and old `/#/...` links still land on the right page
- Every character, devil fruit, affiliation, occupation, saga, arc, volume and chapter page is served as prerendered HTML with its own title, description, canonical URL and OG image
- Key facts per entity are readable as text in the HTML, not only inside charts
- `sitemap.xml` and `robots.txt` exist and are submitted in Google Search Console
- The site rebuilds automatically after the weekly data pipeline finishes
- Interactive features (network graph, games, AI chat, compare tools) work exactly as before

Each phase below ships as its own PR and can go live on its own.

## Target architecture and key decisions

Static site generation, not server-side rendering: the data changes weekly, so all pages are built once per week and served from Cloudflare's CDN with no runtime server.

```text
Weekly data pipeline (ismailsunni/onepieceofdata, GitHub Actions)
  -> writes Supabase + GitHub Releases
  -> repository_dispatch "data-updated"
       |
       v
Site build (ismailsunni/onepieceofdata-react, GitHub Actions)
  1. bulk-fetch Supabase into build cache
  2. react-router build: prerender all entity pages to HTML (with meta)
  3. generate OG images + sitemap.xml
  4. wrangler deploy
       |
       v
Cloudflare (static assets + CDN)
  - prerendered HTML for entity, list and analytics pages
  - SPA fallback for client-only routes (chat, games, compare)
       |
       v
Browser: hydrates, TanStack Query + Supabase for live/interactive data
```

| Decision      | Choice                                                     | Why                                                                       |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Rendering     | React Router v7 framework mode, `ssr: false` + `prerender` | Already on React Router v7; real HTML per page with no server             |
| Hosting       | Cloudflare static assets                                   | Free CDN, SPA fallback, custom headers; GitHub Pages can't rewrite routes |
| Build         | Stays in GitHub Actions, deployed with wrangler            | Secrets and the weekly trigger stay in GitHub                             |
| URLs          | Same paths as today, minus `#`                             | No URL redesign in this migration                                         |
| Data at build | One bulk fetch per table, in-memory cache                  | Thousands of pages, so no per-page queries                                |
| OG images     | satori + resvg at build time                               | Static, cacheable, no edge runtime                                        |
| Rejected      | Full SSR, an edge Worker injecting meta                    | Per-request work for weekly data; more to maintain                        |

## Phase 0: Audit and prep

No user-facing change; this produces a short audit note (`docs/migration-audit.md`) that later phases rely on.

1. List every route in the router config with its params, and classify each one:
   - **Prerender**: entity list and detail pages, home, analytics dashboards
   - **Client-only shell**: AI chat, games, compare tool, network graph, timeline, word cloud, appearance race
   - **Noindex**: `/embed/insights/:chartId`
2. Count rows per entity type in Supabase to estimate total pages (expected: a few thousand).
3. Find browser-only code that would crash in Node at build time: `window`, `document`, `localStorage`, `matchMedia`, `navigator` at module scope or during render; and libraries that touch the DOM on import (Sigma.js, Graphology renderers, vis-network, word cloud).
4. Find where pages read data (TanStack Query hooks into Supabase services), so loaders can reuse the same service functions.
5. Note the current URL param format (numeric id vs slug). Keep it unchanged in this migration; changing URLs is a separate decision.
6. Confirm `netlify.toml` is unused and mark it for removal.
7. Record a baseline: Lighthouse scores for home and one character page, and current bundle size.

## Phase 1: Cloudflare hosting and BrowserRouter

Ship clean URLs on Cloudflare while the app is still a plain SPA. This is small, low-risk and independently useful.

1. **Router:** replace `HashRouter` with `BrowserRouter`. Fix any hard-coded `#/` links, `href`s and share URLs (including the games' shareable result images and embed URLs).
2. **Legacy hash shim:** add an inline script in `index.html`, before the app bundle, that converts old links: if `location.hash` starts with `#/`, call `history.replaceState(null, '', location.hash.slice(1))`. The server never sees the hash, so this must run client-side.
3. **Hosting:** deploy the `dist/` output to Cloudflare. Use Workers static assets (Cloudflare's current recommendation for new projects) or Pages; check current Cloudflare docs before choosing. Configure SPA fallback so unknown paths serve the app shell with status 200.
4. **Headers:** add long-lived immutable caching for hashed assets (`/assets/*`) and short caching for HTML.
5. **CI:** replace the GitHub Pages deploy job with `cloudflare/wrangler-action`. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, plus the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep building in GitHub Actions.
6. **Preview:** verify everything on the `*.workers.dev` or `*.pages.dev` URL first. Do not touch DNS yet (see Cutover).
7. Delete `netlify.toml`, and update the README deployment section and `CLAUDE.md`.

## Phase 2: React Router framework mode and prerendering

Move from React Router library mode to framework mode with `ssr: false` and a `prerender` list. The output stays fully static, but each listed path gets real HTML at build time. This is the largest phase; split it into sub-PRs if needed.

1. **Framework setup:** add `@react-router/dev`, swap the Vite React plugin for `reactRouter()`, and add `react-router.config.ts` with `ssr: false`. Move the app into `app/` with `root.tsx` and `routes.ts`, porting the existing route tree one-to-one. Keep Vitest working with its own config, since the React Router plugin should not run under tests.
2. **Prerender list:** in `react-router.config.ts`, make `prerender()` return home, all list pages, analytics dashboards, and one path per entity row (characters, devil fruits, affiliations, occupations, sagas, arcs, volumes, chapters). Build the list from Supabase.
3. **Build-time data cache:** create one server-only module (for example `app/data/build-cache.server.ts`) that bulk-fetches each table once per build and serves lookups from memory. Loaders must never issue one Supabase query per page, which would mean thousands of requests per build.
4. **Loaders:** give each prerendered route a `loader` that reads from the cache and returns only what the first paint and SEO need: name, key stats, related links. Hand that to TanStack Query as `initialData` (or hydrate it), so existing components keep working and can still refetch client-side.
5. **Client-only pieces:** wrap browser-only components (Sigma.js graph, vis-network, word cloud, AI chat, games, anything reading `localStorage` such as persisted column visibility) in a `ClientOnly` boundary or a lazy import inside `useEffect`. The prerendered HTML shows a sized placeholder, which avoids layout shift.
6. **SPA fallback:** routes not in the prerender list (chat, games, compare tool) are served by the generated SPA fallback HTML. Configure the Cloudflare fallback to point at that file instead of `index.html`, and verify that prerendered files take precedence over the fallback rule.
7. **Hydration check:** no hydration warnings in the console on any page type. Watch for dates, `Math.random`, locale formatting, and anything that reads `window` during render.
8. **Embed routes:** keep `/embed/insights/:chartId` client-only and send `noindex` for them.

Check current React Router v7 docs for the exact `prerender` and `ssr: false` behavior (fallback file name, loader rules) before implementing.

## Phase 3: SEO metadata, sitemap and structured data

Every prerendered page gets unique, accurate metadata and indexable text.

1. **Per-route `meta` export:** title (for example "Monkey D. Luffy: appearances, bounty and stats | One Piece of Data"), a description built from real numbers, canonical URL, `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card=summary_large_image`. Share one helper so the format stays consistent.
2. **Indexable text:** each entity page renders a short factual summary as text, for example first appearance, number of chapters appeared in, latest bounty, affiliations. Charts alone are not indexed.
3. **Internal links:** detail pages link to related entities (arc to its characters, character to their devil fruit) as real `<a href>` links, so crawlers can reach every page.
4. **`sitemap.xml`:** generated at build from the same path list as `prerender()`, with `lastmod` taken from the data update date. Split it into a sitemap index if it exceeds 50,000 URLs.
5. **`robots.txt`:** allow all, disallow `/embed/`, and point to the sitemap.
6. **Structured data (JSON-LD):** `WebSite` with a `SearchAction` on home, `BreadcrumbList` on detail pages, and a `Dataset` entry describing the open data (licence, GitHub Releases link).
7. **404s:** unknown entity paths should return a real 404 page, not a 200 shell, where Cloudflare's routing allows it.
8. **After launch:** verify the domain in Google Search Console, submit the sitemap, and check coverage after one to two weeks.

## Phase 4: Per-page OG images

Each shared link shows a branded data card, which turns every share into a mini @onepieceofdata post.

1. **Generator:** a post-build script (`scripts/generate-og.ts`) using `satori` and `@resvg/resvg-js` writes 1200×630 PNGs to `build/client/og/<type>/<id>.png`. It reuses the build-time data cache.
2. **Templates:** one per entity type: character (name, latest bounty, chapters appeared, first appearance, affiliation), arc (chapter range, length, main characters), devil fruit (type, users), plus a default site card. Include the site name and @onepieceofdata handle on every card.
3. **Artwork:** use typography and data only. Do not embed character portraits scraped from the Fandom wiki in OG images, since these get redistributed widely.
4. **Fonts:** bundle the TTF files in the repo; satori needs them as buffers.
5. **Speed:** store a hash of each entity's card data, skip unchanged images, and persist `og/` between runs with the GitHub Actions cache. Target: a no-change rebuild adds under one minute.
6. **Wiring:** `og:image` in the Phase 3 meta helper points to the absolute URL of the matching PNG, falling back to the default card.

## Phase 5: Weekly rebuild automation

The site rebuilds itself after each weekly data run, so pages, sitemap and OG images never go stale.

1. **Trigger from the data repo:** add a final step to the weekly workflow in `ismailsunni/onepieceofdata`, after data lands in Supabase, that fires `repository_dispatch` with event type `data-updated` on `ismailsunni/onepieceofdata-react`. Use a fine-grained PAT scoped to that one repo, stored as a secret.
2. **Listen in the site repo:** the deploy workflow triggers on `push` to `master`, `repository_dispatch` (`data-updated`), and `workflow_dispatch` for manual runs.
3. **Safe deploys:** fail the build, and keep the previous deploy live, if the prerendered page count drops more than 5% from the last build. This catches a half-loaded database.
4. **Notify:** post a short summary (pages built, OG images regenerated, duration) to the workflow summary.

## Cutover and verification checklist

Run this on the preview URL first, then again on onepieceofdata.com after the DNS switch.

- [ ] `curl -s <url>/characters/<id>` returns HTML containing that character's title, description and `og:image`, with no JavaScript needed
- [ ] An old link like `/#/characters/<id>` lands on `/characters/<id>`
- [ ] Client-only pages (chat, games, compare, network graph) load and work
- [ ] No hydration warnings in the console on each page type
- [ ] Link previews render correctly in Facebook Sharing Debugger, LinkedIn Post Inspector, WhatsApp and Discord
- [ ] `sitemap.xml` and `robots.txt` resolve and validate
- [ ] Google Rich Results Test passes for a detail page
- [ ] Lighthouse SEO and performance are at or above the Phase 0 baseline
- [ ] DNS: add onepieceofdata.com as a custom domain on Cloudflare, then remove the GitHub Pages `CNAME` and disable GitHub Pages. Keep GitHub Pages running until Cloudflare serves the domain
- [ ] Google Search Console: domain verified and sitemap submitted
- [ ] A manual `data-updated` dispatch triggers a full rebuild and deploy

## Risks and gotchas

| Risk                                            | Mitigation                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Framework-mode migration touches every route    | Port the route tree one-to-one first with no behavior change, then add loaders route type by route type  |
| Browser-only libraries crash the Node prerender | Phase 0 inventory; `ClientOnly` wrappers and lazy imports                                                |
| Hydration mismatches cause flicker or errors    | Render only deterministic data on the server; format dates and numbers the same way in both environments |
| Supabase rate limits or slow builds             | Bulk-fetch once into the build cache; never query per page                                               |
| Build time grows with OG images                 | Hash-based skipping plus the Actions cache                                                               |
| Fallback rule shadows prerendered files         | Test on the preview URL that `/characters/<id>` serves its own HTML, not the fallback                    |
| A broken data run publishes an empty site       | The page-count guard in Phase 5                                                                          |
| Copyright on wiki images                        | Text-and-data OG cards only; keep the existing attribution in the footer and README                      |

## Prompt to hand to Claude Code

Export this doc as Markdown, save it in the repo as `docs/migration-plan.md`, then paste:

```markdown
Read docs/migration-plan.md and CLAUDE.md. We are migrating onepieceofdata.com from a HashRouter SPA on GitHub Pages to Cloudflare with React Router v7 framework mode and build-time prerendering.

Work one phase at a time, in order (Phase 0 to Phase 5). For each phase:

- Create a branch named migration/phase-N and open one PR.
- Before using React Router prerender/ssr:false, Cloudflare static assets or wrangler, check their current official docs; do not rely on memory for config shapes.
- Keep all existing features working; run npm test, npm run lint and npm run build before opening the PR.
- In the PR description, list what changed, anything from the plan you deviated from and why, and how you verified it.
- Stop after each PR and wait for my review before starting the next phase.

Start with Phase 0 and write the audit to docs/migration-audit.md.
```
