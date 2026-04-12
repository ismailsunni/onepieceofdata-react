import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Link } from 'react-router-dom'
import { ChartCard } from '../common/ChartCard'
import {
  type LoyalCharacter,
  type ArcCountDistribution,
  type SagaCountDistribution,
  type ArcIntroRate,
  type SagaIntroRate,
  type CharacterGap,
} from '../../services/analyticsService'
import { SectionTitle } from './SectionTitle'

export interface AppearancesSectionProps {
  insights: {
    mostLoyal: LoyalCharacter[]
    arcIntroRate: ArcIntroRate[]
    sagaIntroRate: SagaIntroRate[]
    longestGaps: CharacterGap[]
  }
  minChapters: number
  setMinChapters: (v: number) => void
  arcCharMode: 'both' | 'new' | 'returning'
  setArcCharMode: (v: 'both' | 'new' | 'returning') => void
  sagaCharMode: 'both' | 'new' | 'returning'
  setSagaCharMode: (v: 'both' | 'new' | 'returning') => void
  arcCountDist: ArcCountDistribution[]
  sagaCountDist: SagaCountDistribution[]
}

export function AppearancesSection({
  insights,
  minChapters,
  setMinChapters,
  arcCharMode,
  setArcCharMode,
  sagaCharMode,
  setSagaCharMode,
  arcCountDist,
  sagaCountDist,
}: AppearancesSectionProps) {
  return (
    <>
      {/* ─── SECTION: Appearances & Longevity ─── */}
      <SectionTitle title="Appearances & Longevity" />

      {/* #5 Most Loyal Characters */}
      <div className="mb-6">
        <ChartCard
          title='Most "Loyal" Characters'
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
        <label htmlFor="minChapters">Min chapters to count as appearing:</label>
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
          title="One-Arc Wonders vs Recurring Cast"
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
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0
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
          title="One-Saga Wonders vs Recurring Cast"
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
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0
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
          title="Characters per Arc (New vs Returning)"
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
          title="Characters per Saga (New vs Returning)"
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
          title="Longest Disappearances"
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
                    <td className="py-2 px-3 font-medium">
                      <Link
                        to={`/characters/${g.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {g.name}
                      </Link>
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
    </>
  )
}

export default AppearancesSection
