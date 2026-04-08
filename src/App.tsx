import { HashRouter, Routes, Route } from 'react-router-dom'
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
const CharacterStatsPage = lazy(() => import('./pages/CharacterStatsPage'))
const CharacterAppearancesPage = lazy(
  () => import('./pages/CharacterAppearancesPage')
)
const StoryArcsAnalyticsPage = lazy(
  () => import('./pages/StoryArcsAnalyticsPage')
)
const CharacterTimelinePage = lazy(
  () => import('./pages/CharacterTimelinePage')
)
const CharacterBirthdayPage = lazy(
  () => import('./pages/CharacterBirthdayPage')
)
const ChapterReleaseCalendarPage = lazy(
  () => import('./pages/ChapterReleaseCalendarPage')
)
const PublicationRatePage = lazy(() => import('./pages/PublicationRatePage'))
const CharacterCompletenessPage = lazy(
  () => import('./pages/CharacterCompletenessPage')
)
const NetworkAnalysisPage = lazy(() => import('./pages/NetworkAnalysisPage'))
const CharacterSagaMatrixPage = lazy(
  () => import('./pages/CharacterSagaMatrixPage')
)
const RegionBountyPage = lazy(() => import('./pages/RegionBountyPage'))
const DevilFruitsPage = lazy(() => import('./pages/DevilFruitsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const CharacterComparePage = lazy(() => import('./pages/CharacterComparePage'))
const OnePieceInsightsPage = lazy(() => import('./pages/OnePieceInsightsPage'))

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
            <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
              <Header />
              <div id="main-content" className="flex-1 overflow-y-auto">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/characters" element={<CharactersPage />} />
                    <Route
                      path="/characters/:id"
                      element={<CharacterDetailPage />}
                    />
                    <Route path="/arcs" element={<ArcsPage />} />
                    <Route path="/arcs/:id" element={<ArcDetailPage />} />
                    <Route path="/sagas" element={<SagasPage />} />
                    <Route path="/sagas/:id" element={<SagaDetailPage />} />
                    <Route path="/chapters" element={<ChaptersPage />} />
                    <Route
                      path="/chapters/:number"
                      element={<ChapterDetailPage />}
                    />
                    <Route path="/volumes" element={<VolumesPage />} />
                    <Route
                      path="/volumes/:number"
                      element={<VolumeDetailPage />}
                    />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route
                      path="/analytics/character-stats"
                      element={<CharacterStatsPage />}
                    />
                    <Route
                      path="/analytics/character-appearances"
                      element={<CharacterAppearancesPage />}
                    />
                    <Route
                      path="/analytics/character-completeness"
                      element={<CharacterCompletenessPage />}
                    />
                    <Route
                      path="/analytics/story-arcs"
                      element={<StoryArcsAnalyticsPage />}
                    />
                    <Route
                      path="/analytics/character-timeline"
                      element={<CharacterTimelinePage />}
                    />
                    <Route
                      path="/analytics/birthdays"
                      element={<CharacterBirthdayPage />}
                    />
                    <Route
                      path="/analytics/chapter-releases"
                      element={<ChapterReleaseCalendarPage />}
                    />
                    <Route
                      path="/analytics/publication-rate"
                      element={<PublicationRatePage />}
                    />
                    <Route
                      path="/analytics/network"
                      element={<NetworkAnalysisPage />}
                    />
                    <Route
                      path="/analytics/saga-matrix"
                      element={<CharacterSagaMatrixPage />}
                    />
                    <Route
                      path="/analytics/region-bounty"
                      element={<RegionBountyPage />}
                    />
                    <Route
                      path="/analytics/insights"
                      element={<OnePieceInsightsPage />}
                    />
                    <Route
                      path="/characters/compare"
                      element={<CharacterComparePage />}
                    />
                    <Route path="/devil-fruits" element={<DevilFruitsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                  </Routes>
                </Suspense>
              </div>
            </div>
          </ErrorBoundary>
          <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
        </HashRouter>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
