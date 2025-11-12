# Copilot Instructions for One Piece of Data React

## Project Architecture

This is a **React + TypeScript + Vite** data exploration app for One Piece universe data, deployed to **GitHub Pages** with **Supabase** backend.

### Critical Design Decisions

1. **HashRouter Required**: Use `HashRouter` (not `BrowserRouter`) for routing because GitHub Pages doesn't support server-side redirects. URLs will have `/#/` format.
2. **Long Cache Strategy**: React Query configured with 24-hour `staleTime` and 7-day `gcTime` because One Piece data is mostly static. See `App.tsx` for configuration.
3. **Graceful Degradation**: Supabase client may be `null` if env vars missing. Always check `if (!supabase)` before API calls.

## Tech Stack

- **State**: React Query (TanStack Query) for server state, no global state library needed
- **Tables**: TanStack Table v8 (headless, TypeScript-first)
- **Styling**: TailwindCSS v4 with utility classes
- **Build**: Vite with base path `/onepieceofdata-react/` for GitHub Pages

## File Organization

```
src/
├── components/     # Shared UI components (Header, CharacterTable)
├── pages/          # Route-level page components (HomePage, CharactersPage)
├── services/       # API layer (supabase.ts, characterService.ts)
├── types/          # TypeScript interfaces (character.ts)
```

**Pattern**: Keep page components thin - they handle routing/query state, delegate rendering to `components/`.

## Data Fetching Pattern

**Always use React Query** for API calls. Example from `CharactersPage.tsx`:

```typescript
const { data: characters = [], isLoading } = useQuery({
  queryKey: ['characters'],
  queryFn: fetchCharacters,
})
```

Service functions (`src/services/`) handle Supabase calls:

```typescript
export async function fetchCharacters(): Promise<Character[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('character')
    .select('*')
    .order('name', { ascending: true })
  if (error) return []
  return data || []
}
```

**Key conventions**:
- Return empty array on errors (don't throw)
- Always check `if (!supabase)` first
- Use console.error for debugging, not user-facing errors

## Table Implementation Pattern

Use TanStack Table's headless approach. See `CharacterTable.tsx` for reference:

1. Define columns with `createColumnHelper<T>()`
2. Pass sorting/pagination state from parent page component
3. Built-in features used: sorting (click headers), filtering (global search), pagination
4. Empty state: Show "No characters found" when `table.getRowModel().rows.length === 0`

## Component Styling

- Use TailwindCSS utility classes exclusively
- Status badges pattern: `bg-green-100 text-green-800` for Alive, `bg-red-100 text-red-800` for Deceased
- Hover states on table rows: `hover:bg-gray-50`
- Card shadows: `rounded-lg shadow-md`

## Environment Variables

Required in GitHub Actions secrets and `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Access via `import.meta.env.VITE_*` (not `process.env`).

## Development Commands

```bash
npm run dev        # Start dev server at localhost:5173
npm run build      # Production build (requires env vars)
npm run preview    # Preview production build locally
npm run lint       # ESLint check
npm run format     # Prettier format
```

## Deployment

Auto-deploys on push to `master` via GitHub Actions (`.github/workflows/deploy.yml`). Build injects env vars from GitHub secrets. Site available at: `https://ismailsunni.github.io/onepieceofdata-react/`

## Database Schema

Supabase table: `character` with columns matching `src/types/character.ts`. Note: some fields are nullable (`string | null`). Additional tables: `arcs`, `devil_fruits` (implementation pending).

## Code Conventions

- TypeScript strict mode enabled
- All functions explicitly return typed arrays/objects
- Props interfaces defined inline at component top
- No default exports except for page components
- Use `useMemo` for column definitions to prevent re-renders

## Known Constraints

- GitHub Pages is static-only (no SSR)
- Supabase free tier: 500MB storage, 2GB bandwidth/month
- Current data is scraped (may have inconsistencies, see `scraping_status` field)
- Mobile responsiveness implemented via Tailwind breakpoints (`md:`, `lg:`)

## When Adding New Features

1. **New page**: Create in `pages/`, add route to `App.tsx` with `<Route path="/..." element={<Page />} />`
2. **New data entity**: Add service in `services/`, type in `types/`, follow `characterService.ts` pattern
3. **New table**: Copy `CharacterTable.tsx` pattern, pass state management to parent page
4. **Styling**: Use existing Tailwind utility patterns, maintain consistency with current components
