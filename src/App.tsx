import { HashRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import CharactersPage from './pages/CharactersPage'
import ArcsPage from './pages/ArcsPage'
import DevilFruitsPage from './pages/DevilFruitsPage'

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/arcs" element={<ArcsPage />} />
          <Route path="/devil-fruits" element={<DevilFruitsPage />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App
