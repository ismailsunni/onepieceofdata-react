// Build time: runs a page's React Query queries so the prerendered HTML has
// its data instead of a loading state. The browser hydrates the same cache
// and refetches stale queries after load.
import {
  QueryClient,
  dehydrate,
  type DehydratedState,
  type FetchQueryOptions,
} from '@tanstack/react-query'
import { arcChaptersQuery, arcQuery } from '../queries/arc'
import { bountyQueries } from '../queries/bounty'
import { chapterQueries } from '../queries/chapter'
import { characterQueries } from '../queries/character'
import { arcsQuery, sagasQuery } from '../queries/reference'
import { sagaArcsQuery, sagaQuery, sagaVolumesQuery } from '../queries/saga'
import { volumeQueries } from '../queries/volume'

// Fetch a query into the page cache; `required` data must be non-empty
type Fetch = <T, K extends readonly unknown[]>(
  options: FetchQueryOptions<T, Error, T, K>,
  required?: boolean
) => Promise<T>

const ROUTES: [RegExp, (param: string, fetch: Fetch) => Promise<unknown>][] = [
  [
    /^\/analytics\/(bounty)$/,
    (_, f) => {
      const q = bountyQueries
      return Promise.all([
        f(q.distribution),
        f(q.stats),
        f(q.topAll),
        f(q.topAlive),
      ])
    },
  ],
  [
    /^\/characters\/([^/]+)$/,
    (id, f) => {
      const q = characterQueries(id)
      return Promise.all([
        f(q.character, true),
        f(q.occupations),
        f(q.affiliations),
        f(q.devilFruits),
        f(q.relations),
        f(arcsQuery),
        f(sagasQuery),
      ])
    },
  ],
  [
    /^\/chapters\/(\d+)$/,
    (n, f) => {
      const q = chapterQueries(Number(n))
      return Promise.all([
        f(q.chapter, true),
        f(q.characters),
        f(q.arc),
        f(arcsQuery),
      ])
    },
  ],
  [
    /^\/volumes\/(\d+)$/,
    (n, f) => {
      const q = volumeQueries(Number(n))
      return Promise.all([
        f(q.volume, true),
        f(q.chapters),
        f(q.coverCharacters),
        f(arcsQuery),
        f(sagasQuery),
      ])
    },
  ],
  [
    /^\/arcs\/([^/]+)$/,
    async (id, f) => {
      const arc = await f(arcQuery(id), true)
      return Promise.all([f(arcChaptersQuery(arc)), f(arcsQuery)])
    },
  ],
  [
    /^\/sagas\/([^/]+)$/,
    async (id, f) => {
      const saga = await f(sagaQuery(id), true)
      return Promise.all([
        f(sagaArcsQuery(saga)),
        f(sagaVolumesQuery(saga)),
        f(sagasQuery),
      ])
    },
  ],
]

// Shared across pages for the whole build: arcs and sagas are fetched once
const buildCache = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity } },
})

export async function prefetchPage(
  pathname: string
): Promise<DehydratedState | null> {
  for (const [pattern, run] of ROUTES) {
    const match = pathname.match(pattern)
    if (!match) continue
    const page = new QueryClient()
    const fetch: Fetch = async (options, required) => {
      const data = await buildCache.fetchQuery(options)
      if (required && (data == null || (Array.isArray(data) && !data.length)))
        throw new Error(`no data for ${JSON.stringify(options.queryKey)}`)
      page.setQueryData<unknown>(options.queryKey as readonly unknown[], data)
      return data
    }
    try {
      await run(decodeURIComponent(match[1]), fetch)
      return dehydrate(page)
    } catch (error) {
      // Fall back to client-side loading rather than baking in a wrong page
      console.warn(`prefetch ${pathname}: ${(error as Error).message}`)
      return null
    }
  }
  return null
}
