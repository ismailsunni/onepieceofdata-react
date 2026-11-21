// Routes rendered only in the browser (served by the SPA fallback, never
// prerendered). Shared by the route config, the Cloudflare Worker (worker/index.ts) and the
// layout's clientLoader.
export const CLIENT_ONLY_PATHS = [
  '/timeline',
  '/chat',
  '/games/',
  '/embed/',
  '/analytics/network',
  '/analytics/story-graph',
  '/analytics/character-timeline',
  '/analytics/word-cloud',
  '/analytics/appearance-race',
  '/analytics/character-compare',
]

export const isClientOnlyPath = (pathname: string) =>
  CLIENT_ONLY_PATHS.some((p) =>
    p.endsWith('/') ? pathname.startsWith(p) : pathname === p
  )
