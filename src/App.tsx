import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import ErrorBoundary from './components/common/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { CACHE } from './constants/cache'

// Eager load home page for faster initial render
import HomePage from './pages/HomePage'

// Lazy load all other pages to reduce initial bundle size
const CharactersPage = lazy(() => import('./pages/CharactersPage'))
const CharacterDetailPage = lazy(() => import('./pages/CharacterDetailPage'))
const ArcsPage = lazy(() => import('./pages/ArcsPage'))
const ArcDetailPage = lazy(() => import('./pages/ArcDetailPage'))
const ChaptersPage = lazy(() => import('./pages/ChaptersPage'))
const ChapterDetailPage = lazy(() => import('./pages/ChapterDetailPage'))
const SagaDetailPage = lazy(() => import('./pages/SagaDetailPage'))
const SagasPage = lazy(() => import('./pages/SagasPage'))
const VolumeDetailPage = lazy(() => import('./pages/VolumeDetailPage'))
const VolumesPage = lazy(() => import('./pages/VolumesPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const CharacterTimelinePage = lazy(
  () => import('./pages/CharacterTimelinePage')
)
const ChapterReleaseCalendarPage = lazy(
  () => import('./pages/ChapterReleaseCalendarPage')
)
const NetworkAnalysisPage = lazy(() => import('./pages/NetworkAnalysisPage'))
const DevilFruitsPage = lazy(() => import('./pages/DevilFruitsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const CharacterComparePage = lazy(() => import('./pages/CharacterComparePage'))
const EmbedInsightPage = lazy(() => import('./pages/EmbedInsightPage'))
const AffiliationsPage = lazy(() => import('./pages/AffiliationsPage'))
const AffiliationDetailPage = lazy(
  () => import('./pages/AffiliationDetailPage')
)
// Topic-based analytics pages
const BountyTopicPage = lazy(
  () => import('./pages/analytics/BountyTopicPage')
)
const AppearancesTopicPage = lazy(
  () => import('./pages/analytics/AppearancesTopicPage')
)
const StoryTopicPage = lazy(
  () => import('./pages/analytics/StoryTopicPage')
)
const DemographicsTopicPage = lazy(
  () => import('./pages/analytics/DemographicsTopicPage')
)
const CharactersTopicPage = lazy(
  () => import('./pages/analytics/CharactersTopicPage')
)
const AffiliationsTopicPage = lazy(
  () => import('./pages/analytics/AffiliationsTopicPage')
)

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  </div>
)

// Create a client with sensible defaults; reference data queries override with CACHE.REFERENCE_*
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

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Embed routes — no header, no page chrome */}
                <Route
                  path="/embed/insights/:chartId"
                  element={<EmbedInsightPage />}
                />

                {/* Main app routes with header */}
                <Route
                  path="/*"
                  element={
                    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
                      <Header />
                      <div id="main-content" className="flex-1 overflow-y-auto">
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route
                              path="/characters"
                              element={<CharactersPage />}
                            />
                            <Route
                              path="/characters/:id"
                              element={<CharacterDetailPage />}
                            />
                            <Route path="/arcs" element={<ArcsPage />} />
                            <Route
                              path="/arcs/:id"
                              element={<ArcDetailPage />}
                            />
                            <Route path="/sagas" element={<SagasPage />} />
                            <Route
                              path="/sagas/:id"
                              element={<SagaDetailPage />}
                            />
                            <Route
                              path="/chapters"
                              element={<ChaptersPage />}
                            />
                            <Route
                              path="/chapters/:number"
                              element={<ChapterDetailPage />}
                            />
                            <Route path="/volumes" element={<VolumesPage />} />
                            <Route
                              path="/volumes/:number"
                              element={<VolumeDetailPage />}
                            />
                            <Route
                              path="/analytics"
                              element={<AnalyticsPage />}
                            />
                            {/* Topic-based analytics pages */}
                            <Route
                              path="/analytics/bounty"
                              element={<BountyTopicPage />}
                            />
                            <Route
                              path="/analytics/appearances"
                              element={<AppearancesTopicPage />}
                            />
                            <Route
                              path="/analytics/story"
                              element={<StoryTopicPage />}
                            />
                            <Route
                              path="/analytics/demographics"
                              element={<DemographicsTopicPage />}
                            />
                            <Route
                              path="/analytics/characters"
                              element={<CharactersTopicPage />}
                            />
                            <Route
                              path="/analytics/affiliations"
                              element={<AffiliationsTopicPage />}
                            />
                            {/* Standalone interactive tools */}
                            <Route
                              path="/analytics/network"
                              element={<NetworkAnalysisPage />}
                            />
                            <Route
                              path="/analytics/character-timeline"
                              element={<CharacterTimelinePage />}
                            />
                            <Route
                              path="/analytics/chapter-releases"
                              element={<ChapterReleaseCalendarPage />}
                            />
                            {/* Redirects from old routes */}
                            <Route
                              path="/analytics/character-stats"
                              element={<Navigate to="/analytics/bounty" replace />}
                            />
                            <Route
                              path="/analytics/region-bounty"
                              element={<Navigate to="/analytics/bounty" replace />}
                            />
                            <Route
                              path="/analytics/character-appearances"
                              element={<Navigate to="/analytics/appearances" replace />}
                            />
                            <Route
                              path="/analytics/saga-matrix"
                              element={<Navigate to="/analytics/appearances" replace />}
                            />
                            <Route
                              path="/analytics/story-arcs"
                              element={<Navigate to="/analytics/story" replace />}
                            />
                            <Route
                              path="/analytics/publication-rate"
                              element={<Navigate to="/analytics/story" replace />}
                            />
                            <Route
                              path="/analytics/birthdays"
                              element={<Navigate to="/analytics/demographics" replace />}
                            />
                            <Route
                              path="/analytics/character-completeness"
                              element={<Navigate to="/analytics/characters" replace />}
                            />
                            <Route
                              path="/analytics/insights"
                              element={<Navigate to="/analytics/bounty" replace />}
                            />
                            <Route
                              path="/analytics/affiliation-network"
                              element={<Navigate to="/analytics/affiliations" replace />}
                            />
                            <Route
                              path="/characters/compare"
                              element={<CharacterComparePage />}
                            />
                            <Route
                              path="/affiliations"
                              element={<AffiliationsPage />}
                            />
                            <Route
                              path="/affiliations/:groupName"
                              element={<AffiliationDetailPage />}
                            />
                            <Route
                              path="/devil-fruits"
                              element={<DevilFruitsPage />}
                            />
                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/chat" element={<ChatPage />} />
                          </Routes>
                        </Suspense>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
        </HashRouter>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
