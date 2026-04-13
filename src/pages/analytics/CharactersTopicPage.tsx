import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchInsightsRawData,
  computeCoverStars,
  computeCoverVsMain,
  computeTopCharactersPerSaga,
  computeTopCharactersPerArc,
} from '../../services/analyticsService'
import { CoverMetaSection } from '../../components/insights/CoverMetaSection'
import { RankingsSection } from '../../components/insights/RankingsSection'
import { SectionTitle } from '../../components/insights/SectionTitle'

function CharactersTopicPage() {
  const location = useLocation()

  // Scroll to chart anchor after data loads
  useEffect(() => {
    const fullHash = window.location.hash
    const anchorMatch = fullHash.match(/#([^/][^#]*)$/)
    if (anchorMatch) {
      const el = document.getElementById(anchorMatch[1])
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          300
        )
      }
    }
  }, [location])

  const [shpFilterSaga, setSHPFilterSaga] = useState<'all' | 'hide' | 'only'>(
    'hide'
  )
  const [showPctPerSaga, setShowPctPerSaga] = useState(false)
  const [shpFilterArc, setSHPFilterArc] = useState<'all' | 'hide' | 'only'>(
    'hide'
  )
  const [showPctPerArc, setShowPctPerArc] = useState(false)

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const insights = useMemo(() => {
    if (!raw) return null
    const { characters, arcs, sagas } = raw
    return {
      coverStars: computeCoverStars(characters),
      coverVsMain: computeCoverVsMain(characters),
      topCharactersPerSaga: computeTopCharactersPerSaga(characters, sagas, 31),
      topCharactersPerArc: computeTopCharactersPerArc(characters, arcs, 31),
    }
  }, [raw])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-600"></div>
        </div>
      </main>
    )
  }

  if (!insights) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link
            to="/analytics"
            className="hover:text-gray-900 transition-colors"
          >
            Analytics
          </Link>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900 font-medium">
            Character Rankings
          </span>
        </nav>

        {/* Hero */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-violet-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 md:w-9 md:h-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                  Character Rankings
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Volume cover appearances and per-saga/arc rankings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Volume Covers */}
        <SectionTitle title="Volume Covers" />

        <CoverMetaSection
          coverStars={insights.coverStars}
          coverVsMain={insights.coverVsMain}
        />

        {/* Section 2: Character Rankings */}
        <SectionTitle title="Character Rankings" />

        <RankingsSection
          topCharactersPerSaga={insights.topCharactersPerSaga}
          topCharactersPerArc={insights.topCharactersPerArc}
          shpFilterSaga={shpFilterSaga}
          setSHPFilterSaga={setSHPFilterSaga}
          showPctPerSaga={showPctPerSaga}
          setShowPctPerSaga={setShowPctPerSaga}
          shpFilterArc={shpFilterArc}
          setSHPFilterArc={setSHPFilterArc}
          showPctPerArc={showPctPerArc}
          setShowPctPerArc={setShowPctPerArc}
        />
      </div>
    </main>
  )
}

export default CharactersTopicPage
