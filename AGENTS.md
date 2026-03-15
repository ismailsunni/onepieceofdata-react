# AGENTS.md — onepieceofdata-react

## What Is This?

A React data-exploration app for One Piece — live at **onepieceofdata.com**.
It visualizes characters, arcs, sagas, chapters, volumes, analytics, and network graphs using data from a Supabase backend.

## Tech Stack

| Layer              | Tech                                   |
| ------------------ | -------------------------------------- |
| Framework          | React 19 + TypeScript                  |
| Build              | Vite 7                                 |
| Routing            | React Router DOM 7 (HashRouter)        |
| Data fetching      | TanStack Query v5                      |
| Styling            | Tailwind CSS v4                        |
| Charts             | Recharts                               |
| Network graphs     | Sigma / Graphology, vis-network        |
| Tables             | TanStack Table v8                      |
| Backend            | Supabase (PostgreSQL)                  |
| Testing            | Vitest + Testing Library               |
| Linting/Formatting | ESLint + Prettier + Husky (pre-commit) |

## Project Structure

```
src/
  App.tsx              # Root: routing, QueryClient setup, lazy page loading
  main.tsx             # Entry point
  pages/               # One component per route (lazy-loaded except HomePage)
  components/          # Reusable UI components
    common/            # Generic: StatCard, ChartCard, Skeleton*, EmptyState, ErrorBoundary, etc.
    analytics/         # Analytics-specific wrappers
    navigation/        # DesktopDropdown, MobileAccordion
  services/            # Supabase data-fetching functions
    analytics/         # Analytics sub-services (appearance, bounty, chapter, demographic, status)
  types/               # TypeScript interfaces: Character, Arc, Saga, Chapter, Volume
  constants/           # cache.ts, pagination.ts, search.ts
  utils/               # logger.ts, mergeChartWithWatermark.ts
  scripts/             # One-off scripts (updateArcSagaIds.ts)
public/
  network_*.json       # Pre-built network graph data (by arc, saga, chapter, consec-N)
  character_*.csv      # Character co-appearance edges and node data
```

## Routes

| Path                                | Page                                  |
| ----------------------------------- | ------------------------------------- |
| `/`                                 | HomePage                              |
| `/characters` / `/characters/:id`   | Characters list + detail              |
| `/arcs` / `/arcs/:id`               | Arcs list + detail                    |
| `/sagas` / `/sagas/:id`             | Sagas list + detail                   |
| `/chapters` / `/chapters/:number`   | Chapters list + detail                |
| `/volumes` / `/volumes/:number`     | Volumes list + detail                 |
| `/analytics`                        | Analytics hub                         |
| `/analytics/character-stats`        | Character statistics                  |
| `/analytics/character-appearances`  | Appearance charts                     |
| `/analytics/character-completeness` | Data completeness                     |
| `/analytics/story-arcs`             | Arc-level analytics                   |
| `/analytics/character-timeline`     | Timeline view                         |
| `/analytics/birthdays`              | Birthday calendar                     |
| `/analytics/chapter-releases`       | Release calendar                      |
| `/analytics/publication-rate`       | Publication rate                      |
| `/analytics/network`                | Network analysis (Sigma + Graphology) |
| `/about`                            | About page                            |

## Key Data Entities

- **Character** — name, origin, status, bounty, birth, appearance lists, arc/saga lists
- **Arc** — arc_id, title, start/end chapter, saga_id
- **Saga** — saga_id, title, start/end chapter
- **Chapter** — number, volume, title, pages, date, jump issue
- **Volume** — number, title, chapter count, cover character count

## Environment

Copy `.env.local.example` → `.env.local` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The Supabase client (`src/services/supabase.ts`) will return `null` if these are missing — services check for this and return empty results gracefully.

## Common Commands

```bash
npm run dev           # Start dev server
npm run build         # TypeScript check + Vite build
npm run preview       # Preview production build
npm run test          # Run tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run lint          # ESLint
npm run format        # Prettier (src/**/*.{ts,tsx,css})
```

## Conventions

- **Lazy loading**: All pages except `HomePage` are `React.lazy()` — keep it that way for bundle size.
- **Data fetching**: Use service functions in `src/services/` + TanStack Query in pages. Don't call Supabase directly from components.
- **Error handling**: Services catch and log errors, returning `[]` or `null`. Pages use `ErrorBoundary` + `ErrorState`. Never let a network error crash the UI.
- **Skeleton loading**: Use `Skeleton*` components from `src/components/common/` while data loads.
- **Caching**: Cache constants live in `src/constants/cache.ts`. Reference/static data uses long stale times.
- **Logging**: Use `src/utils/logger.ts`, not raw `console.*`.
- **Testing**: Tests live in `__tests__/` subdirs or `src/test/`. Vitest + jsdom environment.
- **Pre-commit**: Husky runs lint-staged (ESLint fix + Prettier) on `.ts/.tsx/.css/.md/.json`.

## Network Graph Notes

- Static JSON files in `public/network_*.json` are pre-computed graph snapshots used by `NetworkAnalysisPage`.
- Sigma/Graphology handles rendering; community detection and layout are done via ForceAtlas2.
- Node click → popup with connected nodes list. Community coloring is a toggleable mode.

## Deployment

- Hosted at `onepieceofdata.com` (CNAME in `public/CNAME`)
- Static site — deploy the `dist/` folder to any static host (e.g., GitHub Pages, Netlify, Vercel)
