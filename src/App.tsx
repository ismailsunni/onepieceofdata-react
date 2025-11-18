import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import CharactersPage from './pages/CharactersPage'
import CharacterDetailPage from './pages/CharacterDetailPage'
import ArcsPage from './pages/ArcsPage'
import ArcDetailPage from './pages/ArcDetailPage'
import ChaptersPage from './pages/ChaptersPage'
import ChapterDetailPage from './pages/ChapterDetailPage'
import SagaDetailPage from './pages/SagaDetailPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AboutPage from './pages/AboutPage'

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
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/:id" element={<CharacterDetailPage />} />
            <Route path="/arcs" element={<ArcsPage />} />
            <Route path="/arcs/:id" element={<ArcDetailPage />} />
            <Route path="/chapters" element={<ChaptersPage />} />
            <Route path="/chapters/:number" element={<ChapterDetailPage />} />
            <Route path="/sagas/:id" element={<SagaDetailPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
