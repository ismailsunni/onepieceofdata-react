import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchRegionBountyData,
  RegionBountyStats,
} from '../../services/analyticsService'
import { ChartCard } from '../common/ChartCard'

type TopN = 5 | 10
type SortKey =
  | 'characterCount'
  | 'totalBounty'
  | 'averageBounty'
  | 'medianBounty'
  | 'avgTop5Bounty'
  | 'medianTop5Bounty'
type SortDir = 'asc' | 'desc'

export function RegionBountySection() {
  const [excludeDead, setExcludeDead] = useState(false)
  const [topN, setTopN] = useState<TopN>(10)
  const [sortKey, setSortKey] = useState<SortKey>('totalBounty')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { data: regionStats = [], isLoading } = useQuery({
    queryKey: ['analytics', 'region-bounty', excludeDead],
    queryFn: () => fetchRegionBountyData(excludeDead),
  })

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (regionStats.length === 0) return null

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
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

      {/* Table */}
      <div className="mb-6">
        <ChartCard
          title={`Top ${topN} Regions — Bounty Breakdown`}
          downloadFileName="region-bounty-table"
          chartId="region-bounty-table"
        >
          <p className="text-sm text-gray-600 mb-4">
            Highest-bounty characters per region
            {excludeDead ? ' (alive only)' : ''}. Click column headers to sort.
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
                {tableRegions.map((region: RegionBountyStats, idx: number) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </>
  )
}
