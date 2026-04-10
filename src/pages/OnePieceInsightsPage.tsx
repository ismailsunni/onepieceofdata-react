import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  Line,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { ChartCard } from '../components/common/ChartCard'
import SortableTable, { Column } from '../components/common/SortableTable'
import { STRAW_HAT_IDS } from '../constants/characters'
import {
  fetchInsightsRawData,
  computeChapterComplexity,
  type BountyJump,
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
} from '../services/analyticsService'

const formatBounty = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

const SAGA_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#14b8a6',
  '#e11d48',
]

const bountyJumpColumns: Column<BountyJump>[] = [
  {
    key: 'name',
    label: 'Character',
    sortValue: (row) => row.name,
    render: (row) => (
      <Link
        to={`/characters/${row.id}`}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
      >
        {row.name}
      </Link>
    ),
  },
  {
    key: 'firstBounty',
    label: 'First Bounty',
    sortValue: (row) => row.firstBounty,
    render: (row) => (
      <span className="text-gray-600">{formatBounty(row.firstBounty)}</span>
    ),
  },
  {
    key: 'lastBounty',
    label: 'Last Bounty',
    sortValue: (row) => row.lastBounty,
    render: (row) => (
      <span className="font-medium text-amber-600">
        {formatBounty(row.lastBounty)}
      </span>
    ),
  },
  {
    key: 'jump',
    label: 'Jump',
    sortValue: (row) => row.jump,
    render: (row) => (
      <span
        className={`font-medium ${row.jump >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
      >
        {row.jump >= 0 ? '+' : '-'}
        {formatBounty(Math.abs(row.jump))}
      </span>
    ),
  },
  {
    key: 'multiplier',
    label: 'Multiplier',
    sortValue: (row) => row.multiplier,
    render: (row) => (
      <span
        className={`font-bold ${row.multiplier >= 1 ? 'text-purple-600' : 'text-red-600'}`}
      >
        {row.multiplier}x
      </span>
    ),
  },
]

function OnePieceInsightsPage() {
  const location = useLocation()

  // Scroll to chart anchor after data loads
  useEffect(() => {
    // HashRouter puts the route in window.location.hash as #/path
    // A permalink anchor is appended as #/path#chart-id
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
        // Round each tier, then adjust the largest to ensure sum === 100
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
                  20 interesting facts about the One Piece universe, powered by
                  data
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

        {/* ─── SECTION: Bounty & Power ─── */}
        <SectionTitle title="Bounty & Power" number="1-4" />

        {/* #1 Characters per Chapter Over Time */}
        <div className="mb-6">
          <ChartCard
            title="#1 Cast Complexity Over Time"
            description="How many characters appear in each chapter? The rolling average (20-chapter window) shows how the story's cast grew more complex over time"
            downloadFileName="cast-complexity"
            chartId="cast-complexity"
            embedPath="/embed/insights/cast-complexity"
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={insights.chapterComplexity}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="chapter"
                  type="number"
                  domain={[1, 'dataMax']}
                  ticks={[
                    1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100,
                  ]}
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                  label={{
                    value: 'Chapter',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fontSize: 11, fill: '#6b7280' },
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip
                  labelFormatter={(label: number) => {
                    const d = insights.chapterComplexity.find(
                      (p) => p.chapter === label
                    )
                    return d
                      ? `Chapter ${label} (${d.arc})`
                      : `Chapter ${label}`
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'Characters in Chapter'
                      ? `${value} characters`
                      : `${value} avg`,
                    name,
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="characters"
                  fill="#dbeafe"
                  stroke="#93c5fd"
                  strokeWidth={1}
                  fillOpacity={0.4}
                  name="Characters in Chapter"
                />
                <Line
                  type="monotone"
                  dataKey="rollingAvg"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Rolling Average (20 ch.)"
                />
                <Line
                  type="linear"
                  dataKey="trend"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={false}
                  name="Trendline"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #2 Bounty vs Appearance Count */}
        <div className="mb-6">
          <ChartCard
            title="#2 Bounty vs Appearance Count"
            description="Do high-bounty characters appear more often? Scatter plot of bounty vs chapter appearances"
            downloadFileName="bounty-vs-appearance"
            chartId="bounty-vs-appearance"
            embedPath="/embed/insights/bounty-vs-appearance"
            filters={
              <button
                onClick={() => setHideStrawHats((v) => !v)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  hideStrawHats
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {hideStrawHats ? 'Straw Hats Hidden' : 'Hide Straw Hats'}
              </button>
            }
          >
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  dataKey="appearances"
                  name="Appearances"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis
                  type="number"
                  dataKey="bounty"
                  name="Bounty"
                  tickFormatter={formatBounty}
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null
                    const d = payload[0]?.payload as
                      | {
                          name?: string
                          bounty?: number
                          appearances?: number
                          status?: string
                        }
                      | undefined
                    if (!d) return null
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
                        <p className="font-semibold text-gray-900">{d.name}</p>
                        <p className="text-gray-600">
                          Bounty:{' '}
                          <span className="font-medium text-amber-600">
                            {formatBounty(d.bounty || 0)}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Appearances:{' '}
                          <span className="font-medium text-blue-600">
                            {d.appearances}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Status:{' '}
                          <span
                            className={
                              d.status === 'Alive'
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }
                          >
                            {d.status}
                          </span>
                        </p>
                      </div>
                    )
                  }}
                />
                <Scatter
                  data={
                    hideStrawHats
                      ? insights.bountyVsAppearance.filter(
                          (d) => !STRAW_HAT_IDS.has(d.id)
                        )
                      : insights.bountyVsAppearance
                  }
                  fill="#6366f1"
                  fillOpacity={0.6}
                >
                  {(hideStrawHats
                    ? insights.bountyVsAppearance.filter(
                        (d) => !STRAW_HAT_IDS.has(d.id)
                      )
                    : insights.bountyVsAppearance
                  ).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.status === 'Alive' ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>{' '}
                Alive
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>{' '}
                Deceased / Unknown
              </span>
            </div>
          </ChartCard>
        </div>

        {/* #3 Bounty Jumps */}
        <div className="mb-6">
          <ChartCard
            title="#3 Bounty Jumps"
            description="All characters with bounty history — sort by absolute jump or multiplier to explore"
            downloadFileName="bounty-jumps"
            chartId="bounty-jumps"
            embedPath="/embed/insights/bounty-jumps"
          >
            {insights.topBountyJumps.length > 0 ? (
              <SortableTable<BountyJump>
                columns={bountyJumpColumns}
                data={insights.topBountyJumps}
                defaultSortField="jump"
                defaultSortDirection="desc"
                rowKey={(row) => row.id}
                maxHeight="500px"
              />
            ) : (
              <p className="text-gray-500 text-center py-8">
                No bounty history data available
              </p>
            )}
          </ChartCard>
        </div>

        {/* #4 Bounty Tier Distribution by Region */}
        <div className="mb-6">
          <ChartCard
            title="#4 Bounty Tier Distribution by Region"
            description="Bounty power-tier breakdown by origin region (regions with 3+ bounty holders). Which regions produce the strongest pirates?"
            downloadFileName="region-bounty-tier"
            chartId="region-bounty-tier"
            embedPath="/embed/insights/region-bounty-tier"
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setBountyTierPercent((v) => !v)}
                className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {bountyTierPercent ? 'Show counts' : 'Show %'}
              </button>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={
                  bountyTierPercent
                    ? regionBountyTierPct
                    : regionBountyTierCount
                }
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                  domain={bountyTierPercent ? [0, 100] : [0, 'auto']}
                  allowDataOverflow={bountyTierPercent}
                  tickFormatter={bountyTierPercent ? (v) => `${v}%` : undefined}
                />
                <YAxis
                  dataKey="region"
                  type="category"
                  width={90}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value: number) =>
                    bountyTierPercent ? `${value}%` : value
                  }
                />
                <Legend
                  content={() => (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-700">
                      {BOUNTY_TIER_LABELS.map(({ label, color }) => (
                        <span key={label} className="flex items-center gap-1">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ backgroundColor: color }}
                          />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                />
                {BOUNTY_TIER_LABELS.map(({ label, color }) => (
                  <Bar
                    key={label}
                    dataKey={label}
                    stackId="a"
                    fill={color}
                    name={label}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ─── SECTION: Appearances & Longevity ─── */}
        <SectionTitle title="Appearances & Longevity" number="5-8" />

        {/* #5 Most Loyal Characters */}
        <div className="mb-6">
          <ChartCard
            title='#5 Most "Loyal" Characters'
            description="Highest appearance density: appearances / (last chapter - first chapter). Who shows up in nearly every chapter of their active span?"
            downloadFileName="most-loyal"
            chartId="most-loyal"
            embedPath="/embed/insights/most-loyal"
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={insights.mostLoyal}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                  label={{
                    value: 'Density (%)',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fontSize: 11, fill: '#6b7280' },
                  }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Density']}
                  labelFormatter={(label: string) => {
                    const c = insights.mostLoyal.find((l) => l.name === label)
                    return c
                      ? `${label} — ${c.appearances} appearances over ${c.span} chapters`
                      : label
                  }}
                />
                <Bar dataKey="density" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Min chapters control for #6 and #6b */}
        <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
          <label htmlFor="minChapters">
            Min chapters to count as appearing:
          </label>
          <input
            id="minChapters"
            type="number"
            min={1}
            max={20}
            value={minChapters}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v) && v >= 1 && v <= 20) setMinChapters(v)
            }}
            className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* #6 One-Arc Wonders */}
        <div className="mb-6">
          <ChartCard
            title="#6 One-Arc Wonders vs Recurring Cast"
            description="How many arcs does each character appear in? Most characters are one-arc wonders"
            downloadFileName="arc-count-distribution"
            chartId="arc-count-distribution"
            embedPath="/embed/insights/arc-count-distribution"
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={arcCountDist}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="arcCount"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip />
                <Bar
                  dataKey="characterCount"
                  fill="#8b5cf6"
                  radius={[8, 8, 0, 0]}
                  name="Characters"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(props: any) => {
                    const { x, y, width, value } = props
                    const total = arcCountDist.reduce(
                      (s, d) => s + d.characterCount,
                      0
                    )
                    const pct =
                      total > 0 ? Math.round((value / total) * 100) : 0
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 5}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#374151"
                      >
                        {value} ({pct}%)
                      </text>
                    )
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #6b One-Saga Wonders */}
        <div className="mb-6">
          <ChartCard
            title="#6b One-Saga Wonders vs Recurring Cast"
            description="How many sagas does each character appear in? Even more characters are one-saga wonders"
            downloadFileName="saga-count-distribution"
            chartId="saga-count-distribution"
            embedPath="/embed/insights/saga-count-distribution"
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={sagaCountDist}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="sagaCount"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip />
                <Bar
                  dataKey="characterCount"
                  fill="#ec4899"
                  radius={[8, 8, 0, 0]}
                  name="Characters"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(props: any) => {
                    const { x, y, width, value } = props
                    const total = sagaCountDist.reduce(
                      (s, d) => s + d.characterCount,
                      0
                    )
                    const pct =
                      total > 0 ? Math.round((value / total) * 100) : 0
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 5}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#374151"
                      >
                        {value} ({pct}%)
                      </text>
                    )
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #7 Character Introduction Rate per Arc */}
        <div className="mb-6">
          <ChartCard
            title="#7 Characters per Arc (New vs Returning)"
            description="How many characters appear in each arc? The stacked bars show new debuts vs returning characters."
            downloadFileName="arc-intro-rate"
            chartId="arc-intro-rate"
            embedPath="/embed/insights/arc-intro-rate"
            filters={
              <div className="flex items-center gap-2">
                {(['both', 'new', 'returning'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setArcCharMode(mode)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      arcCharMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {mode === 'both'
                      ? 'Both'
                      : mode === 'new'
                        ? 'New'
                        : 'Returning'}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={insights.arcIntroRate}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="arc"
                  tick={{ fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip
                  labelFormatter={(label: string) => {
                    const d = insights.arcIntroRate.find((a) => a.arc === label)
                    return `${label} (${d?.saga || 'Unknown'})`
                  }}
                />
                <Legend />
                {(arcCharMode === 'both' || arcCharMode === 'returning') && (
                  <Bar
                    dataKey="returningCharacters"
                    name="Returning Characters"
                    stackId="characters"
                    fill="#f59e0b"
                    radius={
                      arcCharMode === 'returning' ? [4, 4, 0, 0] : undefined
                    }
                  />
                )}
                {(arcCharMode === 'both' || arcCharMode === 'new') && (
                  <Bar
                    dataKey="newCharacters"
                    name="New Characters"
                    stackId="characters"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #7b Character Introduction Rate per Saga */}
        <div className="mb-6">
          <ChartCard
            title="#7b Characters per Saga (New vs Returning)"
            description="How many characters appear in each saga? A higher-level view of new debuts vs returning cast."
            downloadFileName="saga-intro-rate"
            chartId="saga-intro-rate"
            embedPath="/embed/insights/saga-intro-rate"
            filters={
              <div className="flex items-center gap-2">
                {(['both', 'new', 'returning'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSagaCharMode(mode)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      sagaCharMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {mode === 'both'
                      ? 'Both'
                      : mode === 'new'
                        ? 'New'
                        : 'Returning'}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={insights.sagaIntroRate}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="saga"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip />
                <Legend />
                {(sagaCharMode === 'both' || sagaCharMode === 'returning') && (
                  <Bar
                    dataKey="returningCharacters"
                    name="Returning Characters"
                    stackId="characters"
                    fill="#f59e0b"
                    radius={
                      sagaCharMode === 'returning' ? [4, 4, 0, 0] : undefined
                    }
                  />
                )}
                {(sagaCharMode === 'both' || sagaCharMode === 'new') && (
                  <Bar
                    dataKey="newCharacters"
                    name="New Characters"
                    stackId="characters"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #8 Gap Analysis */}
        <div className="mb-6">
          <ChartCard
            title="#8 Longest Disappearances"
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
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {g.name}
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

        {/* ─── SECTION: Story Structure ─── */}
        <SectionTitle title="Story Structure" number="9-12" />

        {/* #9 Arc Length Trend */}
        <div className="mb-6">
          <ChartCard
            title="#9 Arc Length Trend"
            description="Are arcs getting longer? Chapter count per arc in chronological order"
            downloadFileName="arc-length-trend"
            chartId="arc-length-trend"
            embedPath="/embed/insights/arc-length-trend"
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={insights.arcLengths}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="arc"
                  tick={{ fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip
                  labelFormatter={(label: string) => {
                    const d = insights.arcLengths.find((a) => a.arc === label)
                    return `${label} (${d?.saga || ''})`
                  }}
                />
                <Bar dataKey="chapters" name="Chapters" radius={[4, 4, 0, 0]}>
                  {insights.arcLengths.map((entry, i) => {
                    const sagaNames = [
                      ...new Set(insights.arcLengths.map((a) => a.saga)),
                    ]
                    const colorIdx = sagaNames.indexOf(entry.saga)
                    return (
                      <Cell
                        key={i}
                        fill={SAGA_COLORS[colorIdx % SAGA_COLORS.length]}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #10 Pages per Arc */}
        <div className="mb-6">
          <ChartCard
            title="#10 Total Pages per Arc"
            description="Actual content volume per arc — not just chapter count but total pages"
            downloadFileName="pages-per-arc"
            chartId="pages-per-arc"
            embedPath="/embed/insights/pages-per-arc"
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={insights.pagesPerArc}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="arc"
                  tick={{ fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'totalPages'
                      ? [`${value.toLocaleString()} pages`, 'Total Pages']
                      : [value, name]
                  }
                />
                <Bar
                  dataKey="totalPages"
                  name="Total Pages"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #11 Saga Pacing */}
        <div className="mb-6">
          <ChartCard
            title="#11 Saga Pacing Comparison"
            description="Compare sagas by chapters, pages, characters, and density"
            downloadFileName="saga-pacing"
            chartId="saga-pacing"
            embedPath="/embed/insights/saga-pacing"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-900">
                      Saga
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      Arcs
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      Chapters
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      Pages
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      Active Characters
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      New Characters
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-900">
                      Chars/Ch.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {insights.sagaPacing.map((s, i) => (
                    <tr
                      key={s.saga}
                      className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                    >
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {s.saga}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {s.arcCount}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {s.totalChapters}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {s.totalPages.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-blue-600">
                        {s.characterCount}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-emerald-600">
                        {s.newCharacters}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-purple-600">
                        {s.density}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>

        {/* #12 Chapter Release Cadence */}
        <div className="mb-6">
          <ChartCard
            title="#12 Chapters per Year"
            description="How Oda's publication rate and break patterns have evolved over time"
            downloadFileName="yearly-releases"
            chartId="yearly-releases"
            embedPath="/embed/insights/yearly-releases"
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={insights.yearlyReleases}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="chapters"
                  fill="#3b82f6"
                  name="Chapters Released"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="breaks"
                  fill="#fbbf24"
                  name="Estimated Breaks"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ─── SECTION: Demographics ─── */}
        <SectionTitle title="Demographics & World-Building" number="13-16" />

        {/* #13 Blood Type Distribution */}
        <div className="mb-6">
          <ChartCard
            title="#13 Blood Type: One Piece vs Japan"
            description="Does Oda follow real-world Japanese blood type distribution?"
            downloadFileName="blood-type-comparison"
            chartId="blood-type-comparison"
            embedPath="/embed/insights/blood-type-comparison"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={insights.bloodType}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="bloodType"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                  label={{
                    value: '%',
                    position: 'insideTopLeft',
                    style: { fontSize: 11, fill: '#6b7280' },
                  }}
                />
                <Tooltip formatter={(value: number) => [`${value}%`]} />
                <Legend />
                <Bar
                  dataKey="opPercent"
                  fill="#3b82f6"
                  name="One Piece"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="japanPercent"
                  fill="#f59e0b"
                  name="Japan (Real)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #14 Birthday Distribution */}
        <div className="mb-6">
          <ChartCard
            title="#14 Birthday Calendar by Month"
            description="Which months have the most character birthdays?"
            downloadFileName="birthday-distribution"
            chartId="birthday-distribution"
            embedPath="/embed/insights/birthday-distribution"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={insights.birthdays}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#ec4899"
                  name="Birthdays"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #15 Origin Region */}
        <div className="mb-6">
          <ChartCard
            title="#15 Origin Region Bubble Chart"
            description="Which regions of the One Piece world are most represented?"
            downloadFileName="origin-regions"
            chartId="origin-regions"
            embedPath="/embed/insights/origin-regions"
          >
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={insights.regionCounts.slice(0, 15).map((r) => ({
                    ...r,
                    [r.region]: r.count,
                  }))}
                  dataKey="count"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={(props: {
                    region?: string
                    count?: number
                    name?: string
                    value?: number
                  }) =>
                    `${props.region || props.name || ''} (${props.count ?? props.value ?? 0})`
                  }
                  labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                >
                  {insights.regionCounts.slice(0, 15).map((_, i) => (
                    <Cell key={i} fill={SAGA_COLORS[i % SAGA_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #16 Age Distribution by Status */}
        <div className="mb-6">
          <ChartCard
            title="#16 Age Distribution by Status"
            description="Histogram of character ages colored by alive/deceased. Is there an 'age of death' cluster?"
            downloadFileName="age-distribution"
            chartId="age-distribution"
            embedPath="/embed/insights/age-distribution"
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={insights.ageDistribution}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="ageRange"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="alive" stackId="a" fill="#10b981" name="Alive" />
                <Bar
                  dataKey="deceased"
                  stackId="a"
                  fill="#ef4444"
                  name="Deceased"
                />
                <Bar
                  dataKey="unknown"
                  stackId="a"
                  fill="#9ca3af"
                  name="Unknown"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ─── SECTION: Cover Stories & Meta ─── */}
        <SectionTitle title="Cover Stories & Meta" number="17-20" />

        {/* #17 Cover Page Stars */}
        <div className="mb-6">
          <ChartCard
            title="#17 Cover Page Stars"
            description="Top 20 characters by cover story appearances"
            downloadFileName="cover-stars"
            chartId="cover-stars"
            embedPath="/embed/insights/cover-stars"
          >
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={insights.coverStars}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6b7280" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <Tooltip />
                <Bar
                  dataKey="coverAppearances"
                  fill="#f59e0b"
                  name="Cover Appearances"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #18 Cover vs Main */}
        <div className="mb-6">
          <ChartCard
            title="#18 Cover vs Main Story Appearances"
            description="Some characters live mostly in cover stories. Scatter plot comparing both appearance types"
            downloadFileName="cover-vs-main"
            chartId="cover-vs-main"
            embedPath="/embed/insights/cover-vs-main"
          >
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  dataKey="main"
                  name="Main Story"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis
                  type="number"
                  dataKey="cover"
                  name="Cover"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  labelFormatter={(
                    _: unknown,
                    payload: ReadonlyArray<{ payload?: { name?: string } }>
                  ) => payload?.[0]?.payload?.name || ''}
                />
                <Scatter
                  data={insights.coverVsMain}
                  fill="#8b5cf6"
                  fillOpacity={0.5}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #19 Arc Density */}
        <div className="mb-6">
          <ChartCard
            title="#19 Character Cast Size per Arc"
            description="Which arcs have the most characters active in them?"
            downloadFileName="arc-density"
            chartId="arc-density"
            embedPath="/embed/insights/arc-density"
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={insights.arcDensity}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="arc"
                  tick={{ fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'uniqueCharacters'
                      ? [value, 'Unique Characters']
                      : [value, name]
                  }
                />
                <Bar
                  dataKey="uniqueCharacters"
                  fill="#06b6d4"
                  name="Unique Characters"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* #20 Data Completeness */}
        <div className="mb-6">
          <ChartCard
            title="#20 The Completeness Gap"
            description="What percentage of characters have each attribute filled? A meta-visualization about the dataset itself"
            downloadFileName="data-completeness"
            chartId="data-completeness"
            embedPath="/embed/insights/data-completeness"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={insights.completeness}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="field"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                  domain={[0, 100]}
                  label={{
                    value: '%',
                    position: 'insideTopLeft',
                    style: { fontSize: 11, fill: '#6b7280' },
                  }}
                />
                <Tooltip
                  formatter={(
                    value: number,
                    _name: string,
                    props: { payload?: CompletenessField }
                  ) => [
                    `${value}% (${props.payload?.filled || 0}/${props.payload?.total || 0})`,
                    'Completeness',
                  ]}
                />
                <Bar
                  dataKey="percent"
                  name="Completeness"
                  radius={[4, 4, 0, 0]}
                >
                  {insights.completeness.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.percent >= 80
                          ? '#10b981'
                          : entry.percent >= 50
                            ? '#f59e0b'
                            : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>{' '}
                {'>='}80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>{' '}
                50-80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>{' '}
                {'<'}50%
              </span>
            </div>
          </ChartCard>
        </div>

        {/* ─── SECTION: Character Rankings ─── */}
        <SectionTitle title="Character Rankings" number="21-22" />

        {/* #21 Top Characters per Saga */}
        <div className="mb-6">
          <ChartCard
            title="#21 Top Characters per Saga"
            description="Who are the main characters of each saga? Characters ranked by chapter appearances within each saga"
            downloadFileName="top-characters-per-saga"
            chartId="top-characters-per-saga"
            embedPath="/embed/insights/top-characters-per-saga"
            filters={
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <button
                    onClick={() => setSHPFilterSaga('all')}
                    className={`px-3 py-1.5 transition-colors ${shpFilterSaga === 'all' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSHPFilterSaga('hide')}
                    className={`px-3 py-1.5 transition-colors ${shpFilterSaga === 'hide' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    Hide SHP
                  </button>
                  <button
                    onClick={() => setSHPFilterSaga('only')}
                    className={`px-3 py-1.5 transition-colors ${shpFilterSaga === 'only' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    Only SHP
                  </button>
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <button
                    onClick={() => setShowPctPerSaga(false)}
                    className={`px-3 py-1.5 transition-colors ${!showPctPerSaga ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    Count
                  </button>
                  <button
                    onClick={() => setShowPctPerSaga(true)}
                    className={`px-3 py-1.5 transition-colors ${showPctPerSaga ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    %
                  </button>
                </div>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[40px] border-r border-gray-200">
                      #
                    </th>
                    {insights.topCharactersPerSaga.map((saga) => (
                      <th
                        key={saga.sagaId}
                        className="bg-gray-50 px-2 py-2 text-center font-medium text-gray-600 min-w-[140px]"
                      >
                        <Link
                          to={`/sagas/${saga.sagaId}`}
                          className="hover:text-blue-600 transition-colors text-xs"
                        >
                          <div>{saga.sagaTitle}</div>
                          <div className="text-[10px] text-gray-400 font-normal">
                            {saga.totalChapters} chapters
                          </div>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const displayRows = 20
                    const filteredSagas = insights.topCharactersPerSaga.map(
                      (saga) => ({
                        ...saga,
                        characters: (shpFilterSaga === 'hide'
                          ? saga.characters.filter(
                              (c) => !STRAW_HAT_IDS.has(c.id)
                            )
                          : shpFilterSaga === 'only'
                            ? saga.characters.filter((c) =>
                                STRAW_HAT_IDS.has(c.id)
                              )
                            : saga.characters
                        ).slice(0, displayRows),
                      })
                    )
                    return Array.from({ length: displayRows }, (_, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${rowIdx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                      >
                        <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-center font-medium text-gray-400 border-r border-gray-200 tabular-nums">
                          {rowIdx + 1}
                        </td>
                        {filteredSagas.map((saga) => {
                          const char = saga.characters[rowIdx]
                          if (!char) {
                            return (
                              <td
                                key={saga.sagaId}
                                className="px-2 py-1.5 text-center text-gray-300"
                              >
                                &ndash;
                              </td>
                            )
                          }
                          const isSHP = STRAW_HAT_IDS.has(char.id)
                          const pct =
                            Math.round(
                              (char.count / saga.totalChapters) * 1000
                            ) / 10
                          const isOver50 = pct > 50
                          return (
                            <td
                              key={saga.sagaId}
                              className={`px-2 py-1.5 text-xs ${isSHP ? 'bg-amber-50' : ''}`}
                              title={`${char.name}: ${char.count} / ${saga.totalChapters} chapters in ${saga.sagaTitle} (${pct}%)`}
                            >
                              <Link
                                to={`/characters/${char.id}`}
                                className={`hover:text-blue-600 transition-colors ${isSHP ? 'font-medium text-amber-700' : ''} ${isOver50 ? 'font-bold' : ''}`}
                              >
                                {char.name}
                              </Link>
                              <span
                                className={`ml-1 tabular-nums ${isOver50 ? 'font-bold text-gray-600' : 'text-gray-400'}`}
                              >
                                ({showPctPerSaga ? `${pct}%` : char.count})
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>

        {/* #22 Top Characters per Arc */}
        <div className="mb-6">
          <ChartCard
            title="#22 Top Characters per Arc"
            description="Who are the main characters of each arc? Characters ranked by chapter appearances within each arc"
            downloadFileName="top-characters-per-arc"
            chartId="top-characters-per-arc"
            embedPath="/embed/insights/top-characters-per-arc"
            filters={
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <button
                    onClick={() => setSHPFilterArc('all')}
                    className={`px-3 py-1.5 transition-colors ${shpFilterArc === 'all' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSHPFilterArc('hide')}
                    className={`px-3 py-1.5 transition-colors ${shpFilterArc === 'hide' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    Hide SHP
                  </button>
                  <button
                    onClick={() => setSHPFilterArc('only')}
                    className={`px-3 py-1.5 transition-colors ${shpFilterArc === 'only' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    Only SHP
                  </button>
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <button
                    onClick={() => setShowPctPerArc(false)}
                    className={`px-3 py-1.5 transition-colors ${!showPctPerArc ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    Count
                  </button>
                  <button
                    onClick={() => setShowPctPerArc(true)}
                    className={`px-3 py-1.5 transition-colors ${showPctPerArc ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    %
                  </button>
                </div>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[40px] border-r border-gray-200">
                      #
                    </th>
                    {insights.topCharactersPerArc.map((arc) => (
                      <th
                        key={arc.arcId}
                        className="bg-gray-50 px-2 py-2 text-center font-medium text-gray-600 min-w-[140px]"
                      >
                        <Link
                          to={`/arcs/${arc.arcId}`}
                          className="hover:text-blue-600 transition-colors text-xs"
                        >
                          <div>{arc.arcTitle}</div>
                          <div className="text-[10px] text-gray-400 font-normal">
                            {arc.totalChapters} chapters
                          </div>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const displayRows = 20
                    const filteredArcs = insights.topCharactersPerArc.map(
                      (arc) => ({
                        ...arc,
                        characters: (shpFilterArc === 'hide'
                          ? arc.characters.filter(
                              (c) => !STRAW_HAT_IDS.has(c.id)
                            )
                          : shpFilterArc === 'only'
                            ? arc.characters.filter((c) =>
                                STRAW_HAT_IDS.has(c.id)
                              )
                            : arc.characters
                        ).slice(0, displayRows),
                      })
                    )
                    return Array.from({ length: displayRows }, (_, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${rowIdx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                      >
                        <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-center font-medium text-gray-400 border-r border-gray-200 tabular-nums">
                          {rowIdx + 1}
                        </td>
                        {filteredArcs.map((arc) => {
                          const char = arc.characters[rowIdx]
                          if (!char) {
                            return (
                              <td
                                key={arc.arcId}
                                className="px-2 py-1.5 text-center text-gray-300"
                              >
                                &ndash;
                              </td>
                            )
                          }
                          const isSHP = STRAW_HAT_IDS.has(char.id)
                          const pct =
                            Math.round(
                              (char.count / arc.totalChapters) * 1000
                            ) / 10
                          const isOver50 = pct > 50
                          return (
                            <td
                              key={arc.arcId}
                              className={`px-2 py-1.5 text-xs ${isSHP ? 'bg-amber-50' : ''}`}
                              title={`${char.name}: ${char.count} / ${arc.totalChapters} chapters in ${arc.arcTitle} (${pct}%)`}
                            >
                              <Link
                                to={`/characters/${char.id}`}
                                className={`hover:text-blue-600 transition-colors ${isSHP ? 'font-medium text-amber-700' : ''} ${isOver50 ? 'font-bold' : ''}`}
                              >
                                {char.name}
                              </Link>
                              <span
                                className={`ml-1 tabular-nums ${isOver50 ? 'font-bold text-gray-600' : 'text-gray-400'}`}
                              >
                                ({showPctPerArc ? `${pct}%` : char.count})
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </div>
    </main>
  )
}

// ── Section divider component ───────────────────────────────────────────────

function SectionTitle({ title, number }: { title: string; number: string }) {
  return (
    <div className="mt-10 mb-6 flex items-center gap-3">
      <span className="text-xs font-bold text-white bg-gray-900 rounded-full px-3 py-1">
        #{number}
      </span>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="flex-1 h-px bg-gray-200"></div>
    </div>
  )
}

// Type import for tooltip
interface CompletenessField {
  field: string
  filled: number
  total: number
  percent: number
}

export default OnePieceInsightsPage
