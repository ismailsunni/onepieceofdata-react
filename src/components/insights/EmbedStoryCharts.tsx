import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { EmbedFooter } from './EmbedFooter'
import { SAGA_COLORS } from './constants'
import type {
  ArcLength,
  ArcPages,
  SagaPacing,
  YearlyRelease,
} from '../../services/analytics/insightsAnalytics'

// ── #9 Arc Length Trend ──────────────────────────────────────────────────────

export function EmbedArcLengthTrend({ data }: { data: ArcLength[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Arc Length Trend
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
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
              const d = data.find((a) => a.arc === label)
              return `${label} (${d?.saga || ''})`
            }}
          />
          <Bar dataKey="chapters" name="Chapters" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => {
              const sagaNames = [...new Set(data.map((a) => a.saga))]
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
      <EmbedFooter />
    </div>
  )
}

// ── #10 Pages per Arc ───────────────────────────────────────────────────────

export function EmbedPagesPerArc({ data }: { data: ArcPages[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Total Pages per Arc
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
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
      <EmbedFooter />
    </div>
  )
}

// ── #11 Saga Pacing ─────────────────────────────────────────────────────────

export function EmbedSagaPacing({ data }: { data: SagaPacing[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Saga Pacing Comparison
      </h2>
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
            {data.map((s, i) => (
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
      <EmbedFooter />
    </div>
  )
}

// ── #12 Yearly Releases ─────────────────────────────────────────────────────

export function EmbedYearlyReleases({ data }: { data: YearlyRelease[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Chapters per Year
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#6b7280" />
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
      <EmbedFooter />
    </div>
  )
}
