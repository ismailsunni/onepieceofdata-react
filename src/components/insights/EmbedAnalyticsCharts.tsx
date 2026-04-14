import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { fetchChapterReleases } from '../../services/analyticsService'
import {
  computeYearlyPublicationStats,
  type YearlyPublicationStat,
} from '../../services/analytics/chapterAnalytics'
import { fetchCharacters } from '../../services/characterService'
import { EmbedFooter } from './EmbedFooter'

function EmbedLoading() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

// ── Publication Rate by Year ────────────────────────────────────────────────

export function EmbedPublicationRate() {
  const { data: releases, isLoading } = useQuery({
    queryKey: ['embed', 'publication-rate-by-year'],
    queryFn: fetchChapterReleases,
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) return <EmbedLoading />

  const yearlyStats: YearlyPublicationStat[] = computeYearlyPublicationStats(
    releases ?? []
  )

  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Yearly Publication Statistics
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={yearlyStats}
          margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <YAxis
            label={{
              value: 'Weeks',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#6b7280', fontSize: 11 },
            }}
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as YearlyPublicationStat
                const publicationRate =
                  data.availableWeeks > 0
                    ? ((data.chapters / data.availableWeeks) * 100).toFixed(1)
                    : '0'
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-gray-900 mb-2">
                      Year {label}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
                      Chapters:{' '}
                      <span className="font-medium">{data.chapters}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded mr-2"></span>
                      Breaks: <span className="font-medium">{data.breaks}</span>
                    </p>
                    <div className="border-t border-gray-200 my-2"></div>
                    <p className="text-sm text-gray-700">
                      Publication Rate:{' '}
                      <span className="font-medium">{publicationRate}%</span>
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px', fontSize: 11 }}
            formatter={(value: string) => {
              if (value === 'chapters') return 'Chapters Published'
              if (value === 'breaks') return 'Break Weeks'
              return value
            }}
          />
          <Bar dataKey="chapters" stackId="a" fill="#10b981" name="chapters" />
          <Bar dataKey="breaks" stackId="a" fill="#ef4444" name="breaks" />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── Completeness Gap ────────────────────────────────────────────────────────

const IMPORTANT_ATTRIBUTES = [
  { key: 'name', label: 'Name' },
  { key: 'origin', label: 'Origin' },
  { key: 'status', label: 'Status' },
  { key: 'age', label: 'Age' },
  { key: 'bounty', label: 'Bounty' },
  { key: 'blood_type_group', label: 'Blood Type Group' },
  { key: 'birth_date', label: 'Birthday' },
]

const COMPLETENESS_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
]

export function EmbedCompleteness() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['embed', 'completeness'],
    queryFn: fetchCharacters,
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) return <EmbedLoading />

  const total = characters.length
  const rows = IMPORTANT_ATTRIBUTES.map((attr) => {
    let filled = 0
    characters.forEach((char) => {
      const value = char[attr.key as keyof typeof char]
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          if (value.length > 0) filled++
        } else if (typeof value === 'number') {
          if (attr.key === 'age' || value > 0) filled++
        } else if (typeof value === 'string') {
          if (value.trim() !== '') filled++
        }
      }
    })
    const percentage = total > 0 ? (filled / total) * 100 : 0
    return {
      attribute: attr.label,
      filled,
      missing: total - filled,
      percentage: parseFloat(percentage.toFixed(1)),
    }
  }).sort((a, b) => b.percentage - a.percentage)

  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Data Completeness per Attribute
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        {total.toLocaleString()} characters tracked
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-900">
                Attribute
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-900">
                Filled
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-900">
                Missing
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-900">
                %
              </th>
              <th className="text-left py-2 px-3 font-semibold text-gray-900 w-1/3">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.attribute}
                className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
              >
                <td className="py-2 px-3 font-medium">{row.attribute}</td>
                <td className="py-2 px-3 text-right text-green-600 font-semibold">
                  {row.filled}
                </td>
                <td className="py-2 px-3 text-right text-red-600 font-semibold">
                  {row.missing}
                </td>
                <td className="py-2 px-3 text-right font-semibold">
                  {row.percentage}%
                </td>
                <td className="py-2 px-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${row.percentage}%`,
                        backgroundColor:
                          COMPLETENESS_COLORS[i % COMPLETENESS_COLORS.length],
                      }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EmbedFooter />
    </div>
  )
}
