import {
  Outlet,
  useLoaderData,
  type ClientLoaderFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
  type ShouldRevalidateFunction,
} from 'react-router'
import { HydrationBoundary } from '@tanstack/react-query'
import Header from '../components/Header'
import PageSummary from '../components/seo/PageSummary'
import { isClientOnlyPath } from '../constants/clientOnlyPaths'
import { seoMeta } from '../seo/meta'
import { prefetchPage } from '../data/prefetch.server'
import { getPageSeo } from '../seo/pages.server'

// Runs at build time for every prerendered path; its result is baked into the
// page HTML and its .data file.
export async function loader({ request }: LoaderFunctionArgs) {
  const { pathname } = new URL(request.url)
  return { seo: getPageSeo(pathname), queries: await prefetchPage(pathname) }
}

// Client navigations read the prerendered .data file; client-only and
// unknown paths have none.
export async function clientLoader({
  request,
  serverLoader,
}: ClientLoaderFunctionArgs) {
  if (isClientOnlyPath(new URL(request.url).pathname))
    return { seo: null, queries: null }
  try {
    return await serverLoader<typeof loader>()
  } catch {
    return { seo: null, queries: null }
  }
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
}) => currentUrl.pathname !== nextUrl.pathname

export const meta: MetaFunction<typeof loader> = ({ data, matches }) =>
  data?.seo ? seoMeta(data.seo) : (matches[0]?.meta ?? [])

export default function AppLayout() {
  const { seo, queries } = useLoaderData<typeof clientLoader>()
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header />
      <div id="main-content" className="flex-1 overflow-y-auto">
        <HydrationBoundary state={queries}>
          <Outlet />
        </HydrationBoundary>
        {seo && <PageSummary seo={seo} />}
      </div>
    </div>
  )
}
