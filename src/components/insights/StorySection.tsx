import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '../common/ChartCard'
import type {
  SagaPacing,
  ChapterComplexityPoint,
} from '../../services/analytics/insightsAnalytics'

interface StorySectionProps {
  sagaPacing: SagaPacing[]
  chapterComplexity?: ChapterComplexityPoint[]
}

export function StorySection({
  sagaPacing,
  chapterComplexity,
}: StorySectionProps) {
  return (
    <>
      {/* Saga Pacing */}
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

      {/* Cast Complexity Over Time */}
      {chapterComplexity && chapterComplexity.length > 0 && (
        <div className="mb-6">
          <ChartCard
            title="Cast Complexity Over Time"
            description="How many characters appear in each chapter? The rolling average (20-chapter window) shows how the story's cast grew more complex over time"
            downloadFileName="cast-complexity"
            chartId="cast-complexity"
            embedPath="/embed/insights/cast-complexity"
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={chapterComplexity}
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
                    const d = chapterComplexity.find(
                      (p) => p.chapter === label
                    )
                    return d ? `Chapter ${label} (${d.arc})` : `Chapter ${label}`
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
      )}
    </>
  )
}
