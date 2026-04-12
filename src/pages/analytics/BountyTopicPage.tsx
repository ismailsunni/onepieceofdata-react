import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchInsightsRawData,
  computeChapterComplexity,
  computeBountyVsAppearance,
  computeTopBountyJumps,
  computeRegionBountyTier,
  BOUNTY_TIER_LABELS,
} from '../../services/analyticsService'
import { BountySection } from '../../components/insights/BountySection'
import { BountyStatsSection } from '../../components/analytics/BountyStatsSection'
import { RegionBountySection } from '../../components/analytics/RegionBountySection'

function BountyTopicPage() {
  const [hideStrawHats, setHideStrawHats] = useState(true)
  const [bountyTierPercent, setBountyTierPercent] = useState(true)

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const insights = useMemo(() => {
    if (!raw) return null
    const { characters, arcs, chapters } = raw
    return {
      chapterComplexity: computeChapterComplexity(
        characters,
        arcs,
        chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) : 0
      ),
      bountyVsAppearance: computeBountyVsAppearance(characters),
      topBountyJumps: computeTopBountyJumps(characters),
      regionBountyTier: computeRegionBountyTier(characters),
    }
  }, [raw])

  const regionBountyTierCount = useMemo(
    () => insights?.regionBountyTier.slice(0, 15) ?? [],
    [insights]
  )
  const regionBountyTierPct = useMemo(
    () =>
      regionBountyTierCount.map((r) => {
        const row: Record<string, string | number> = { region: r.region }
        if (r.total <= 0) {
          for (const { label } of BOUNTY_TIER_LABELS) row[label] = 0
          return row
        }
        const raw: { label: string; pct: number }[] = BOUNTY_TIER_LABELS.map(
          ({ label }) => {
            const v = (r[label] as number) || 0
            return { label, pct: Math.round((v / r.total) * 1000) / 10 }
          }
        )
        const sum = raw.reduce((s, t) => s + t.pct, 0)
        if (sum !== 100) {
          const largest = raw.reduce((a, b) => (b.pct > a.pct ? b : a))
          largest.pct = Math.round((largest.pct + (100 - sum)) * 10) / 10
        }
        for (const t of raw) row[t.label] = t.pct
        return row
      }),
    [regionBountyTierCount]
  )

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
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
          <span className="text-gray-900 font-medium">Bounty & Power</span>
        </nav>

        {/* Hero */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                  Bounty & Power
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Exploring bounties, power scaling, and regional threat levels
                  across the One Piece world
                </p>
              </div>
            </div>
          </div>
        </div>

        <BountySection
          insights={insights}
          hideStrawHats={hideStrawHats}
          onToggleHideStrawHats={() => setHideStrawHats((v) => !v)}
          bountyTierPercent={bountyTierPercent}
          onToggleBountyTierPercent={() => setBountyTierPercent((v) => !v)}
          regionBountyTierCount={regionBountyTierCount}
          regionBountyTierPct={regionBountyTierPct}
        />

        <BountyStatsSection />

        <RegionBountySection />
      </div>
    </main>
  )
}

export default BountyTopicPage
