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
import { ChartCard } from '../common/ChartCard'
import { SectionTitle } from './SectionTitle'
import { SAGA_COLORS } from './constants'
import type {
  ArcLength,
  ArcPages,
  SagaPacing,
  YearlyRelease,
} from '../../services/analytics/insightsAnalytics'

interface StorySectionProps {
  arcLengths: ArcLength[]
  pagesPerArc: ArcPages[]
  sagaPacing: SagaPacing[]
  yearlyReleases: YearlyRelease[]
}

export function StorySection({
  arcLengths,
  pagesPerArc,
  sagaPacing,
  yearlyReleases,
}: StorySectionProps) {
  return (
    <>
      {/* ─── SECTION: Story Structure ─── */}
      <SectionTitle title="Story Structure" />

      {/* #9 Arc Length Trend */}
      <div className="mb-6">
        <ChartCard
          title="Arc Length Trend"
          description="Are arcs getting longer? Chapter count per arc in chronological order"
          downloadFileName="arc-length-trend"
          chartId="arc-length-trend"
          embedPath="/embed/insights/arc-length-trend"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={arcLengths}
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
                  const d = arcLengths.find((a) => a.arc === label)
                  return `${label} (${d?.saga || ''})`
                }}
              />
              <Bar dataKey="chapters" name="Chapters" radius={[4, 4, 0, 0]}>
                {arcLengths.map((entry, i) => {
                  const sagaNames = [...new Set(arcLengths.map((a) => a.saga))]
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
          title="Total Pages per Arc"
          description="Actual content volume per arc — not just chapter count but total pages"
          downloadFileName="pages-per-arc"
          chartId="pages-per-arc"
          embedPath="/embed/insights/pages-per-arc"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={pagesPerArc}
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
          title="Saga Pacing Comparison"
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
                {sagaPacing.map((s, i) => (
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
          title="Chapters per Year"
          description="How Oda's publication rate and break patterns have evolved over time"
          downloadFileName="yearly-releases"
          chartId="yearly-releases"
          embedPath="/embed/insights/yearly-releases"
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={yearlyReleases}
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
        </ChartCard>
      </div>
    </>
  )
}
