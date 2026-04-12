import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchInsightsRawData,
  computeChapterComplexity,
  computeBountyVsAppearance,
  computeTopBountyJumps,
  computeRegionBountyTier,
  BOUNTY_TIER_LABELS,
  computeMostLoyal,
  computeArcCountDistribution,
  computeSagaCountDistribution,
  computeArcIntroRate,
  computeSagaIntroRate,
  computeLongestGaps,
  computeArcLengths,
  computePagesPerArc,
  computeSagaPacing,
  computeYearlyReleases,
  computeBloodTypeComparison,
  computeBirthdayDistribution,
  computeRegionCounts,
  computeAgeDistribution,
  computeCoverStars,
  computeCoverVsMain,
  computeArcDensity,
  computeCompleteness,
  computeTopCharactersPerSaga,
  computeTopCharactersPerArc,
  computeLargestGroups,
  computeCrewLoyalty,
} from '../services/analyticsService'
import { BountySection } from '../components/insights/BountySection'
import { AppearancesSection } from '../components/insights/AppearancesSection'
import { StorySection } from '../components/insights/StorySection'
import { DemographicsSection } from '../components/insights/DemographicsSection'
import { CoverMetaSection } from '../components/insights/CoverMetaSection'
import { RankingsSection } from '../components/insights/RankingsSection'
import { AffiliationsSection } from '../components/insights/AffiliationsSection'

function OnePieceInsightsPage() {
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

  const [hideStrawHats, setHideStrawHats] = useState(true)
  const [bountyTierPercent, setBountyTierPercent] = useState(true)
  const [minChapters, setMinChapters] = useState(2)
  const [arcCharMode, setArcCharMode] = useState<'both' | 'new' | 'returning'>(
    'both'
  )
  const [sagaCharMode, setSagaCharMode] = useState<
    'both' | 'new' | 'returning'
  >('both')
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
    const { characters, arcs, sagas, chapters } = raw
    return {
      chapterComplexity: computeChapterComplexity(
        characters,
        arcs,
        chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) : 0
      ),
      bountyVsAppearance: computeBountyVsAppearance(characters),
      topBountyJumps: computeTopBountyJumps(characters),
      regionBountyTier: computeRegionBountyTier(characters),
      mostLoyal: computeMostLoyal(characters),
      arcIntroRate: computeArcIntroRate(characters, arcs),
      sagaIntroRate: computeSagaIntroRate(characters, sagas),
      longestGaps: computeLongestGaps(characters),
      arcLengths: computeArcLengths(arcs),
      pagesPerArc: computePagesPerArc(arcs, chapters),
      sagaPacing: computeSagaPacing(sagas, arcs, characters, chapters),
      yearlyReleases: computeYearlyReleases(chapters),
      bloodType: computeBloodTypeComparison(characters),
      birthdays: computeBirthdayDistribution(characters),
      regionCounts: computeRegionCounts(characters),
      ageDistribution: computeAgeDistribution(characters),
      coverStars: computeCoverStars(characters),
      coverVsMain: computeCoverVsMain(characters),
      arcDensity: computeArcDensity(characters, arcs),
      completeness: computeCompleteness(characters),
      topCharactersPerSaga: computeTopCharactersPerSaga(characters, sagas, 31),
      topCharactersPerArc: computeTopCharactersPerArc(characters, arcs, 31),
      largestGroups: computeLargestGroups(raw.affiliations),
      crewLoyalty: computeCrewLoyalty(raw.affiliations),
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </main>
    )
  }

  if (!insights) return null

  // Quick summary stats
  const oneArcWonders = arcCountDist.find((d) => d.arcCount === '1 arc')
  const totalWithArcs = arcCountDist.reduce((s, d) => s + d.characterCount, 0)
  const oneSagaWonders = sagaCountDist.find((d) => d.sagaCount === '1 saga')
  const totalWithSagas = sagaCountDist.reduce((s, d) => s + d.characterCount, 0)
  const longestArc = [...insights.arcLengths].sort(
    (a, b) => b.chapters - a.chapters
  )[0]
  const mostPages = [...insights.pagesPerArc].sort(
    (a, b) => b.totalPages - a.totalPages
  )[0]

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
          <span className="text-gray-900 font-medium">One Piece Insights</span>
        </nav>

        {/* Hero */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  One Piece Insights
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  26 charts exploring the One Piece universe, powered by data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">One-Arc Wonders</p>
            <p className="text-2xl font-bold text-gray-900">
              {oneArcWonders?.characterCount || 0}
            </p>
            <p className="text-xs text-gray-400">
              {totalWithArcs > 0
                ? `${Math.round(((oneArcWonders?.characterCount || 0) / totalWithArcs) * 100)}% of characters`
                : ''}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">One-Saga Wonders</p>
            <p className="text-2xl font-bold text-gray-900">
              {oneSagaWonders?.characterCount || 0}
            </p>
            <p className="text-xs text-gray-400">
              {totalWithSagas > 0
                ? `${Math.round(((oneSagaWonders?.characterCount || 0) / totalWithSagas) * 100)}% of characters`
                : ''}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Longest Arc</p>
            <p className="text-2xl font-bold text-gray-900">
              {longestArc?.chapters || 0} ch.
            </p>
            <p className="text-xs text-gray-400">{longestArc?.arc || '-'}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Most Pages</p>
            <p className="text-2xl font-bold text-gray-900">
              {mostPages?.totalPages.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-400">{mostPages?.arc || '-'}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Top Bounty Jump</p>
            <p className="text-2xl font-bold text-gray-900">
              {insights.topBountyJumps[0]
                ? `${insights.topBountyJumps[0].multiplier}x`
                : '-'}
            </p>
            <p className="text-xs text-gray-400">
              {insights.topBountyJumps[0]?.name || '-'}
            </p>
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

        <AppearancesSection
          insights={insights}
          minChapters={minChapters}
          setMinChapters={setMinChapters}
          arcCharMode={arcCharMode}
          setArcCharMode={setArcCharMode}
          sagaCharMode={sagaCharMode}
          setSagaCharMode={setSagaCharMode}
          arcCountDist={arcCountDist}
          sagaCountDist={sagaCountDist}
        />

        <StorySection
          arcLengths={insights.arcLengths}
          pagesPerArc={insights.pagesPerArc}
          sagaPacing={insights.sagaPacing}
          yearlyReleases={insights.yearlyReleases}
        />

        <DemographicsSection
          bloodType={insights.bloodType}
          birthdays={insights.birthdays}
          regionCounts={insights.regionCounts}
          ageDistribution={insights.ageDistribution}
        />

        <CoverMetaSection
          coverStars={insights.coverStars}
          coverVsMain={insights.coverVsMain}
          arcDensity={insights.arcDensity}
          completeness={insights.completeness}
        />

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

        <AffiliationsSection
          largestGroups={insights.largestGroups}
          crewLoyalty={insights.crewLoyalty}
        />
      </div>
    </main>
  )
}

export default OnePieceInsightsPage
