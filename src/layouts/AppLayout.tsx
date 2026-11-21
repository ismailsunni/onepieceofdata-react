import { Suspense } from 'react'
import {
  Outlet,
  useLoaderData,
  type ClientLoaderFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
  type ShouldRevalidateFunction,
} from 'react-router'
import Header from '../components/Header'
import PageLoader from '../components/common/PageLoader'
import PageSummary from '../components/seo/PageSummary'
import { isClientOnlyPath } from '../constants/clientOnlyPaths'
import { seoMeta } from '../seo/meta'
import { getPageSeo } from '../seo/pages.server'

// Runs at build time for every prerendered path; its result is baked into the
// page HTML and its .data file.
export const loader = ({ request }: LoaderFunctionArgs) => ({
  seo: getPageSeo(new URL(request.url).pathname),
})

// Client navigations read the prerendered .data file; client-only and
// unknown paths have none.
export async function clientLoader({
  request,
  serverLoader,
}: ClientLoaderFunctionArgs) {
  if (isClientOnlyPath(new URL(request.url).pathname)) return { seo: null }
  try {
    return await serverLoader<typeof loader>()
  } catch {
    return { seo: null }
  }
}

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
}) => currentUrl.pathname !== nextUrl.pathname

export const meta: MetaFunction<typeof loader> = ({ data, matches }) =>
  data?.seo ? seoMeta(data.seo) : (matches[0]?.meta ?? [])

export default function AppLayout() {
  const { seo } = useLoaderData<typeof clientLoader>()
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header />
      <div id="main-content" className="flex-1 overflow-y-auto">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
        {seo && <PageSummary seo={seo} />}
      </div>
    </div>
  )
}
