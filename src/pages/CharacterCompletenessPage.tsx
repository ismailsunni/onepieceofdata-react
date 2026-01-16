import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import { StatCard, SectionHeader } from '../components/analytics'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { toPng } from 'html-to-image'

// Define important attributes to track
const IMPORTANT_ATTRIBUTES = [
  { key: 'name', label: 'Name' },
  { key: 'origin', label: 'Origin' },
  { key: 'status', label: 'Status' },
  { key: 'age', label: 'Age' },
  { key: 'bounty', label: 'Bounty' },
  { key: 'blood_type_group', label: 'Blood Type Group' },
  { key: 'birth_date', label: 'Birthday' },
]

// Color palette
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
]

function CharacterCompletenessPage() {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch all characters
  const { data: allCharacters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  // Calculate completeness for each attribute
  const completenessData = useMemo(() => {
    if (!allCharacters.length) return []

    const totalCharacters = allCharacters.length

    return IMPORTANT_ATTRIBUTES.map((attr) => {
      let filledCount = 0

      allCharacters.forEach((char) => {
        const value = char[attr.key as keyof typeof char]

        // Check if the attribute has a meaningful value
        if (value !== null && value !== undefined) {
          // For arrays, check if they have items
          if (Array.isArray(value)) {
            if (value.length > 0) filledCount++
          }
          // For numbers, check if they're greater than 0 (except for age which can be 0)
          else if (typeof value === 'number') {
            if (attr.key === 'age' || value > 0) filledCount++
          }
          // For strings, check if they're not empty
          else if (typeof value === 'string') {
            if (value.trim() !== '') filledCount++
          }
        }
      })

      const percentage = ((filledCount / totalCharacters) * 100).toFixed(1)

      return {
        attribute: attr.label,
        filled: filledCount,
        missing: totalCharacters - filledCount,
        percentage: parseFloat(percentage),
        total: totalCharacters,
      }
    }).sort((a, b) => b.percentage - a.percentage) // Sort by completeness descending
  }, [allCharacters])

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!completenessData.length) {
      return {
        avgCompleteness: 0,
        mostComplete: '-',
        mostCompletePercent: 0,
        leastComplete: '-',
        leastCompletePercent: 0,
        totalCharacters: 0,
      }
    }

    const avgCompleteness = completenessData.reduce((sum, d) => sum + d.percentage, 0) / completenessData.length
    const mostComplete = completenessData[0]
    const leastComplete = completenessData[completenessData.length - 1]

    return {
      avgCompleteness: avgCompleteness.toFixed(1),
      mostComplete: mostComplete.attribute,
      mostCompletePercent: mostComplete.percentage,
      leastComplete: leastComplete.attribute,
      leastCompletePercent: leastComplete.percentage,
      totalCharacters: completenessData[0]?.total || 0,
    }
  }, [completenessData])

  // Download chart handler
  const handleDownloadChart = async () => {
    if (!chartRef.current) return

    setIsExporting(true)
    try {
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = 'character-attribute-completeness.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error exporting chart:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 md:w-9 md:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Character Data Completeness
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Analyze the completeness of character profile attributes in the database
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <StatCard
                label="Total Characters"
                value={stats.totalCharacters}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                }
                color="blue"
                loading={isLoading}
              />
              <StatCard
                label="Avg Completeness"
                value={`${stats.avgCompleteness}%`}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
                color="emerald"
                loading={isLoading}
                tooltip="Average completeness across all tracked attributes"
              />
              <StatCard
                label="Most Complete"
                value={stats.mostComplete}
                subtitle={`${stats.mostCompletePercent}%`}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                color="green"
                loading={isLoading}
              />
              <StatCard
                label="Least Complete"
                value={stats.leastComplete}
                subtitle={`${stats.leastCompletePercent}%`}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                color="amber"
                loading={isLoading}
              />
            </div>

            {/* Completeness Chart */}
            {completenessData.length > 0 && (
              <>
                <SectionHeader
                  title="Attribute Completeness Breakdown"
                  description="Percentage of characters with each attribute filled"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  }
                />
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8 relative">
                  {/* Download Button */}
                  <div className="absolute right-6 top-6 z-10">
                    <button
                      onClick={handleDownloadChart}
                      disabled={isExporting}
                      className={`p-2 rounded-lg transition-colors ${
                        isExporting
                          ? 'text-gray-400 bg-gray-50 cursor-wait'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      title="Download chart"
                    >
                      {isExporting ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Chart Content */}
                  <div ref={chartRef} className="bg-white p-2">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={completenessData}
                        margin={{ top: 20, right: 80, left: 120, bottom: 20 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          stroke="#6b7280"
                          label={{
                            value: 'Completeness (%)',
                            position: 'bottom',
                            style: { fontSize: 14, fill: '#374151', fontWeight: 600 },
                          }}
                        />
                        <YAxis
                          type="category"
                          dataKey="attribute"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          stroke="#6b7280"
                          width={100}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                                  <p className="font-semibold text-gray-900 mb-2">
                                    {data.attribute}
                                  </p>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-gray-600">
                                      <span className="font-medium">Filled:</span>{' '}
                                      <span className="text-green-600 font-semibold">
                                        {data.filled} ({data.percentage}%)
                                      </span>
                                    </p>
                                    <p className="text-gray-600">
                                      <span className="font-medium">Missing:</span>{' '}
                                      <span className="text-red-600 font-semibold">
                                        {data.missing}
                                      </span>
                                    </p>
                                    <p className="text-gray-600 text-xs pt-1 border-t border-gray-200 mt-2">
                                      Total: {data.total} characters
                                    </p>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
                          {completenessData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Sorted by completeness (highest to lowest)
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Detailed Table */}
            {completenessData.length > 0 && (
              <>
                <SectionHeader
                  title="Detailed Completeness Statistics"
                  description="Comprehensive breakdown of each attribute's data availability"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  }
                />
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Attribute
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Filled
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Missing
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Completeness
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {completenessData.map((item, index) => (
                          <tr key={item.attribute} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-3"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <span className="text-sm font-medium text-gray-900">{item.attribute}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-semibold">
                              {item.filled}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-semibold">
                              {item.missing}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                              {item.percentage}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${item.percentage}%`,
                                    backgroundColor: COLORS[index % COLORS.length],
                                  }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {completenessData.length === 0 && (
              <div className="text-center py-20">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <p className="text-gray-500 text-lg">
                  No character data available at the moment.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default CharacterCompletenessPage
