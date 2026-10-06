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
import { CoverPerVolumeSection } from '../../components/analytics/CoverPerVolumeSection'
import { CoverRankSection } from '../../components/analytics/CoverRankSection'
import { RankingsSection } from '../../components/insights/RankingsSection'
import { MainCharacterMomentsSection } from '../../components/analytics/MainCharacterMomentsSection'
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
          <span className="text-gray-900 font-medium">Character Rankings</span>
        </nav>

        {/* Hero */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 md:w-9 md:h-9 text-blue-600"
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
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
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

        <CoverPerVolumeSection />

        <CoverRankSection />

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

        <MainCharacterMomentsSection />
      </div>
    </main>
  )
}

export default CharactersTopicPage
