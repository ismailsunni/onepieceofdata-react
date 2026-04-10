import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  fetchRegionBountyData,
  RegionBountyStats,
} from '../services/analyticsService'
import { ChartCard } from '../components/common/ChartCard'

type TopN = 5 | 10
type SortKey =
  | 'characterCount'
  | 'totalBounty'
  | 'averageBounty'
  | 'medianBounty'
  | 'avgTop5Bounty'
  | 'medianTop5Bounty'
type SortDir = 'asc' | 'desc'

function RegionBountyPage() {
  const [excludeDead, setExcludeDead] = useState(false)
  const [topN, setTopN] = useState<TopN>(10)
  const [sortKey, setSortKey] = useState<SortKey>('totalBounty')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { data: regionStats = [], isLoading } = useQuery({
    queryKey: ['analytics', 'region-bounty', excludeDead],
    queryFn: () => fetchRegionBountyData(excludeDead),
  })

  // Chart data: top N regions by total bounty
  const chartData = useMemo(() => {
    return regionStats.slice(0, topN).map((r) => ({
      region: r.region,
      averageBounty: r.averageBounty,
      totalBounty: r.totalBounty,
      characterCount: r.characterCount,
    }))
  }, [regionStats, topN])

  // Table data: top N regions, sorted by selected column
  const tableRegions = useMemo(() => {
    const sliced = regionStats.slice(0, topN)
    return [...sliced].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      return (a[sortKey] - b[sortKey]) * mul
    })
  }, [regionStats, topN, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const formatBounty = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toLocaleString()
  }

  const renderSortIcon = (column: SortKey) => {
    if (sortKey !== column) {
      return (
        <svg
          className="w-3 h-3 ml-1 inline text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }
    return sortDir === 'desc' ? (
      <svg
        className="w-3 h-3 ml-1 inline text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    ) : (
      <svg
        className="w-3 h-3 ml-1 inline text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    )
  }

  const sortableThClass =
    'text-right py-3 px-3 font-semibold text-gray-900 cursor-pointer select-none hover:text-blue-600 transition-colors'

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
            Region Bounty Analysis
          </span>
        </nav>

        {/* Hero Section */}
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
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                  Region Bounty Analysis
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Discover which origin regions produce the strongest characters
                  by bounty
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Dead/Alive Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Include deceased:
            </span>
            <button
              onClick={() => setExcludeDead(false)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                !excludeDead
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setExcludeDead(true)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                excludeDead
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Alive Only
            </button>
          </div>

          {/* Top N Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <button
              onClick={() => setTopN(5)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                topN === 5
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => setTopN(10)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                topN === 10
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Top 10
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && regionStats.length > 0 && (
          <>
            {/* Chart: Total Bounty by Region */}
            <div className="mb-6">
              <ChartCard
                title={`Top ${topN} Regions by Total Bounty`}
                downloadFileName="region-bounty-chart"
                chartId="region-bounty-chart"
              >
                <p className="text-sm text-gray-600 mb-4">
                  Total combined bounty per origin region
                  {excludeDead ? ' (alive characters only)' : ''}
                </p>
                <ResponsiveContainer
                  width="100%"
                  height={topN === 5 ? 300 : 450}
                >
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                      tickFormatter={formatBounty}
                    />
                    <YAxis
                      dataKey="region"
                      type="category"
                      width={110}
                      tick={{ fontSize: 11 }}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'totalBounty')
                          return [`฿${value.toLocaleString()}`, 'Total Bounty']
                        return [value, name]
                      }}
                      labelFormatter={(label: string) => {
                        const region = chartData.find((r) => r.region === label)
                        return region
                          ? `${label} (${region.characterCount} characters, Avg: ฿${formatBounty(region.averageBounty)})`
                          : label
                      }}
                    />
                    <Bar
                      dataKey="totalBounty"
                      fill="#f59e0b"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Table: Per-region breakdown */}
            <div className="mb-6">
              <ChartCard
                title={`Top ${topN} Regions — Bounty Breakdown`}
                downloadFileName="region-bounty-table"
                chartId="region-bounty-table"
              >
                <p className="text-sm text-gray-600 mb-4">
                  Highest-bounty characters per region
                  {excludeDead ? ' (alive only)' : ''}. Click column headers to
                  sort.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-3 font-semibold text-gray-900">
                          Region
                        </th>
                        <th
                          className={sortableThClass}
                          onClick={() => handleSort('characterCount')}
                        >
                          Characters
                          {renderSortIcon('characterCount')}
                        </th>
                        <th
                          className={sortableThClass}
                          onClick={() => handleSort('totalBounty')}
                        >
                          Total Bounty
                          {renderSortIcon('totalBounty')}
                        </th>
                        <th
                          className={sortableThClass}
                          onClick={() => handleSort('averageBounty')}
                        >
                          Average Bounty
                          {renderSortIcon('averageBounty')}
                        </th>
                        <th
                          className={sortableThClass}
                          onClick={() => handleSort('medianBounty')}
                        >
                          Median Bounty
                          {renderSortIcon('medianBounty')}
                        </th>
                        <th
                          className={sortableThClass}
                          onClick={() => handleSort('avgTop5Bounty')}
                        >
                          Avg Top 5{renderSortIcon('avgTop5Bounty')}
                        </th>
                        <th
                          className={sortableThClass}
                          onClick={() => handleSort('medianTop5Bounty')}
                        >
                          Median Top 5{renderSortIcon('medianTop5Bounty')}
                        </th>
                        <th className="text-left py-3 px-3 font-semibold text-gray-900">
                          Top Characters
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRegions.map(
                        (region: RegionBountyStats, idx: number) => (
                          <tr
                            key={region.region}
                            className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                          >
                            <td className="py-3 px-3 font-semibold text-gray-900">
                              {region.region}
                            </td>
                            <td className="py-3 px-3 text-right text-gray-700">
                              {region.characterCount}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-amber-600">
                              ฿{region.totalBounty.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-purple-600">
                              ฿{region.averageBounty.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-blue-600">
                              ฿{region.medianBounty.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-emerald-600">
                              ฿{region.avgTop5Bounty.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-teal-600">
                              ฿{region.medianTop5Bounty.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-gray-700">
                              <div className="flex flex-wrap gap-1">
                                {region.topCharacters.slice(0, 3).map((c) => (
                                  <span
                                    key={c.name}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      c.status === 'Alive'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {c.name} (฿{formatBounty(c.bounty)})
                                  </span>
                                ))}
                                {region.topCharacters.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{region.topCharacters.length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && regionStats.length === 0 && (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-500 text-lg">
              No region bounty data available.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export default RegionBountyPage
