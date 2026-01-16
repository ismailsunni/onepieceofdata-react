import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import Header from './components/Header'

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
const CharacterAppearancesPage = lazy(() => import('./pages/CharacterAppearancesPage'))
const StoryArcsAnalyticsPage = lazy(() => import('./pages/StoryArcsAnalyticsPage'))
const CharacterTimelinePage = lazy(() => import('./pages/CharacterTimelinePage'))
const CharacterBirthdayPage = lazy(() => import('./pages/CharacterBirthdayPage'))
const ChapterReleaseCalendarPage = lazy(() => import('./pages/ChapterReleaseCalendarPage'))
const PublicationRatePage = lazy(() => import('./pages/PublicationRatePage'))
const CharacterCompletenessPage = lazy(() => import('./pages/CharacterCompletenessPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  </div>
)

// Create a client with longer cache times for static data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours - data stays fresh for a day
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - cache persists for a week
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch when component remounts if data exists
      retry: 2, // Retry failed requests twice
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
          <Header />
          <div className="pt-16">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/characters" element={<CharactersPage />} />
                <Route path="/characters/:id" element={<CharacterDetailPage />} />
                <Route path="/arcs" element={<ArcsPage />} />
                <Route path="/arcs/:id" element={<ArcDetailPage />} />
                <Route path="/sagas" element={<SagasPage />} />
                <Route path="/sagas/:id" element={<SagaDetailPage />} />
                <Route path="/chapters" element={<ChaptersPage />} />
                <Route path="/chapters/:number" element={<ChapterDetailPage />} />
                <Route path="/volumes" element={<VolumesPage />} />
                <Route path="/volumes/:number" element={<VolumeDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/analytics/character-stats" element={<CharacterStatsPage />} />
                <Route path="/analytics/character-appearances" element={<CharacterAppearancesPage />} />
                <Route path="/analytics/character-completeness" element={<CharacterCompletenessPage />} />
                <Route path="/analytics/story-arcs" element={<StoryArcsAnalyticsPage />} />
                <Route path="/analytics/character-timeline" element={<CharacterTimelinePage />} />
                <Route path="/analytics/birthdays" element={<CharacterBirthdayPage />} />
                <Route path="/analytics/chapter-releases" element={<ChapterReleaseCalendarPage />} />
                <Route path="/analytics/publication-rate" element={<PublicationRatePage />} />
                <Route path="/about" element={<AboutPage />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
