import { useEffect, type ReactNode } from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  type MetaFunction,
} from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import PageLoader from './components/common/PageLoader'
import { AuthProvider } from './contexts/AuthContext'
import { CACHE } from './constants/cache'
import { SITE_NAME } from './constants/site'
import './index.css'

declare global {
  interface Window {
    umami?: {
      track: (
        payload:
          | string
          | Record<string, unknown>
          | ((props: Record<string, unknown>) => Record<string, unknown>)
      ) => void
    }
  }
}

export const meta: MetaFunction = () => [
  { title: SITE_NAME },
  {
    name: 'description',
    content:
      'Explore One Piece characters, arcs, chapters, devil fruits and bounties through interactive data and charts.',
  },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Legacy hash URLs (/#/characters/1) reload at their clean path. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(location.hash.startsWith('#/'))location.replace(location.hash.slice(1))",
          }}
        />
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="c11281e6-ce6f-4dde-bb5c-80d89cfc670c"
          data-auto-track="false"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// Tracks route changes as Umami pageviews (auto-tracking is disabled above).
const RouteTracker = () => {
  const location = useLocation()

  useEffect(() => {
    if (!window.umami) return
    const url = `${location.pathname}${location.search}`
    window.umami.track((props) => ({ ...props, url }))
  }, [location.pathname, location.search])

  return null
}

// Scrolls to the element matching the URL hash (e.g. chart permalinks like
// /analytics/characters#top-characters-per-arc). The app scrolls inside
// #main-content, not the window, so native anchor scrolling never fires.
// Pages load data after mount, so poll briefly until the target appears.
const ScrollToHash = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.slice(1))
    if (!id) return

    let frame = 0
    const start = performance.now()
    const tryScroll = () => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      if (performance.now() - start < 3000) {
        frame = requestAnimationFrame(tryScroll)
      }
    }
    frame = requestAnimationFrame(tryScroll)

    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}

// Shown by the SPA fallback page while client-only routes load.
export function HydrateFallback() {
  return <PageLoader />
}

// Reference data queries override these defaults with CACHE.REFERENCE_*
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE.DEFAULT_STALE,
      gcTime: CACHE.DEFAULT_GC,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
})

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouteTracker />
        <ScrollToHash />
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
        <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
      </QueryClientProvider>
    </AuthProvider>
  )
}
