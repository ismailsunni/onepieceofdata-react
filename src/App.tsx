import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import CharactersPage from './pages/CharactersPage'
import CharacterDetailPage from './pages/CharacterDetailPage'
import ArcsPage from './pages/ArcsPage'
import ChaptersPage from './pages/ChaptersPage'
import DevilFruitsPage from './pages/DevilFruitsPage'
import AnalyticsPage from './pages/AnalyticsPage'

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
            <Route path="/chapters" element={<ChaptersPage />} />
            <Route path="/devil-fruits" element={<DevilFruitsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </div>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
