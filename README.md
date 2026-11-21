# One Piece of Data

A data-exploration site for the One Piece universe — characters, arcs, devil fruits, haki, occupations, affiliations, and analytics — built with React and Supabase.

🌐 **Live:** https://onepieceofdata.com

## Features

### Explore

- **Characters** — sortable/filterable table with persisted column visibility, advanced filters by saga / arc / chapter / time-skip, and detail pages with bio, appearances, devil fruit, haki, affiliations, and occupations
- **Devil Fruits** — merged by name + model, with paginated list, type/sub-type filters, and all known users per fruit
- **Affiliations** & **Occupations** — group/role rosters with status breakdowns and example holders
- **Sagas / Arcs / Volumes / Chapters** — cross-linked detail pages with featured character portraits

### Analytics

- Topic dashboards: bounty, appearances, demographics, story, character rankings, affiliations, data quality
- Interactive tools: character compare, character network, timeline, word cloud, appearance race, release predictor
- Per-character calendar with appearance streaks and Jump-issue release forecasting

### Games

- **Guess the Character** (image quiz) and **Who Am I?** (progressive hints) — local stats, score tiers, shareable result images

### Other

- Global search with real-time results
- AI chat assistant
- Embeddable insight charts (`/embed/insights/:chartId`)

## Tech Stack

- **React 19** + TypeScript, **Vite**
- **React Router v7** (BrowserRouter, clean URLs)
- **TanStack Query** (data fetching) and **TanStack Table** (tables)
- **TailwindCSS v4** + Headless UI + Radix
- **Recharts**, **Sigma.js** + Graphology, **vis-network**
- **Supabase** (PostgreSQL backend)
- **Vitest** + React Testing Library
- ESLint, Prettier, Husky pre-commit hooks
- Deployed via GitHub Actions to Cloudflare (Workers static assets)

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # then fill in Supabase credentials
npm run dev
```

App runs at `http://localhost:5173`.

### Environment

Create `.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Scripts

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `npm run dev`           | Start dev server                 |
| `npm run build`         | Production build                 |
| `npm run preview`       | Preview production build locally |
| `npm test`              | Run Vitest                       |
| `npm run test:watch`    | Vitest in watch mode             |
| `npm run test:coverage` | Vitest with coverage             |
| `npm run lint`          | ESLint                           |
| `npm run format`        | Prettier                         |

## Project Structure

```
src/
├── pages/          # Route-level pages (page-based architecture)
├── components/     # Shared UI (analytics/, common/, navigation/)
├── services/       # Supabase clients and data services
├── hooks/          # Custom hooks
├── contexts/       # React Context providers
├── types/          # TypeScript types
├── utils/          # Helpers
└── constants/      # Shared constants
```

See `CLAUDE.md` for architecture, design system, and contribution conventions.

## Deployment

The site is a static build served by Cloudflare (Workers static assets, `wrangler.jsonc`):

- `npm run build` fetches the Supabase tables once (`scripts/fetch-build-data.ts` → `.cache/build-data.json`), prerenders every entity, list and analytics page with React Router (`ssr: false` + `prerender`), then writes `sitemap.xml`, `robots.txt` and OG cards (`scripts/postbuild.ts`). Set `SKIP_OG=1` to skip the cards.
- Client-only routes (games, chat, interactive tools) are served by the SPA fallback; `worker/index.ts` returns a real 404 for unknown paths.
- `VITE_SITE_URL` sets the canonical domain (default `https://onepieceofdata.com`).
- Manual deploy: `npm run build && npm run deploy`. Local preview of the build: `npm run preview`.

`.github/workflows/deploy-cloudflare.yml` deploys on push to `master`, on a `data-updated` repository dispatch, and manually. It refuses to deploy if the page count drops more than 5% from the live sitemap.

Required repository secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### Weekly rebuild trigger

The data pipeline (`ismailsunni/onepieceofdata`) triggers a rebuild after each weekly run. Add this as the last step of its workflow, with a fine-grained PAT scoped to this repository (Contents: read and write) stored as `SITE_DISPATCH_TOKEN`:

```yaml
- name: Rebuild onepieceofdata.com
  run: gh api repos/ismailsunni/onepieceofdata-react/dispatches -f event_type=data-updated
  env:
    GH_TOKEN: ${{ secrets.SITE_DISPATCH_TOKEN }}
```

`deploy.yml` (GitHub Pages) is kept as a manual fallback. See `docs/migration-plan.md`.

## Data Source & Attribution

Character, arc, and chapter data is scraped from the [One Piece Fandom Wiki](https://onepiece.fandom.com/) and used under fair use for non-commercial educational purposes. One Piece is © Eiichiro Oda / Shueisha / Toei Animation.

## License

[GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later).

This is a strong copyleft license: you may use, modify, and redistribute the code, but any modified version — including one hosted as a network service — must be released under the same license with its source available.
