// Runs only when no static asset matches the request: serves the SPA
// fallback for client-only routes, and a real 404 for everything else.
import { isClientOnlyPath } from '../src/constants/clientOnlyPaths'

// Google Search Console ownership file (routed here by run_worker_first,
// since asset html_handling would redirect the .html URL)
const GOOGLE_VERIFY = 'google22336630a6d3a036.html'

interface Env {
  ASSETS: { fetch: (input: Request | URL) => Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)
    if (url.pathname === `/${GOOGLE_VERIFY}`) {
      return new Response(`google-site-verification: ${GOOGLE_VERIFY}`, {
        headers: { 'Content-Type': 'text/html' },
      })
    }
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
