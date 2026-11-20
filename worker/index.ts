// Runs only when no static asset matches the request: serves the SPA
// fallback for client-only routes, and a real 404 for everything else.
import { isClientOnlyPath } from '../src/constants/clientOnlyPaths'

interface Env {
  ASSETS: { fetch: (input: Request | URL) => Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    // Missing files (including .data for non-prerendered paths)
    if (/\.[a-z0-9]+$/i.test(url.pathname)) {
      return new Response('Not found', { status: 404 })
    }
    const fallback = await env.ASSETS.fetch(new URL('/__spa-fallback', url))
    const response = new Response(fallback.body, {
      status: isClientOnlyPath(url.pathname) ? 200 : 404,
      headers: fallback.headers,
    })
    if (url.pathname.startsWith('/embed/')) {
      response.headers.set('X-Robots-Tag', 'noindex')
    }
    return response
  },
}
