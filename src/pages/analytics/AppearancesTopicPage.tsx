import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchInsightsRawData,
  computeMostLoyal,
  computeArcCountDistribution,
  computeSagaCountDistribution,
  computeArcIntroRate,
  computeSagaIntroRate,
  computeLongestGaps,
} from '../../services/analyticsService'
import { AppearancesSection } from '../../components/insights/AppearancesSection'
import { AppearanceChartsSection } from '../../components/analytics/AppearanceChartsSection'
import { SagaMatrixSection } from '../../components/analytics/SagaMatrixSection'
import { SectionTitle } from '../../components/insights/SectionTitle'
import { ChartCard } from '../../components/common/ChartCard'

function AppearancesTopicPage() {
  const location = useLocation()

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

  const [minChapters, setMinChapters] = useState(2)
  const [arcCharMode, setArcCharMode] = useState<'both' | 'new' | 'returning'>(
    'both'
  )
  const [sagaCharMode, setSagaCharMode] = useState<
    'both' | 'new' | 'returning'
  >('both')
  const [wondersMode, setWondersMode] = useState<'arc' | 'saga'>('arc')

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const insights = useMemo(() => {
    if (!raw) return null
    const { characters, arcs, sagas } = raw
    return {
      mostLoyal: computeMostLoyal(characters),
      arcIntroRate: computeArcIntroRate(characters, arcs),
      sagaIntroRate: computeSagaIntroRate(characters, sagas),
      longestGaps: computeLongestGaps(characters),
    }
  }, [raw])

  const arcCountDist = useMemo(
    () =>
      raw
        ? computeArcCountDistribution(raw.characters, raw.arcs, minChapters)
        : [],
    [raw, minChapters]
  )
  const sagaCountDist = useMemo(
    () =>
      raw
        ? computeSagaCountDistribution(raw.characters, raw.sagas, minChapters)
        : [],
    [raw, minChapters]
  )

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
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
            Appearances & Longevity
          </span>
        </nav>

        {/* Hero */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                  Appearances & Longevity
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Tracking character loyalty, introduction rates, and longevity
                  across arcs and sagas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Overview & Loyalty */}
        <AppearanceChartsSection mostLoyal={insights.mostLoyal} />

        {/* Section 2: Introduction Cadence */}
        <AppearancesSection
          insights={{
            arcIntroRate: insights.arcIntroRate,
            sagaIntroRate: insights.sagaIntroRate,
          }}
          minChapters={minChapters}
          setMinChapters={setMinChapters}
          arcCharMode={arcCharMode}
          setArcCharMode={setArcCharMode}
          sagaCharMode={sagaCharMode}
          setSagaCharMode={setSagaCharMode}
          wondersMode={wondersMode}
          setWondersMode={setWondersMode}
          arcCountDist={arcCountDist}
          sagaCountDist={sagaCountDist}
        />

        {/* Section 3: Deep Dives */}
        <SectionTitle title="Deep Dives" />

        {/* Longest Disappearances */}
        <div className="mb-6">
          <ChartCard
            title="Longest Disappearances"
            description="Characters with the longest gap between chapter appearances. Who vanished and came back?"
            downloadFileName="gap-analysis"
            chartId="gap-analysis"
            embedPath="/embed/insights/gap-analysis"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">
                      Character
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      Gap (chapters)
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      From Ch.
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      To Ch.
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      Total Appearances
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insights.longestGaps.map((g, i) => (
                    <tr
                      key={g.name}
                      className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                    >
                      <td className="py-2 px-3 font-medium">
                        <Link
                          to={`/characters/${g.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {g.name}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-red-600">
                        {g.gapLength}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {g.gapStart}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {g.gapEnd}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {g.totalAppearances}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>

        {/* Saga Matrix Heatmap */}
        <SagaMatrixSection />
      </div>
    </main>
  )
}

export default AppearancesTopicPage
