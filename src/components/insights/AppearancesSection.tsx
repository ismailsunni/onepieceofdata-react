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
import { ChartCard } from '../common/ChartCard'
import {
  type ArcCountDistribution,
  type SagaCountDistribution,
  type ArcIntroRate,
  type SagaIntroRate,
} from '../../services/analyticsService'
import { SectionTitle } from './SectionTitle'

export interface AppearancesSectionProps {
  insights: {
    arcIntroRate: ArcIntroRate[]
    sagaIntroRate: SagaIntroRate[]
  }
  minChapters: number
  setMinChapters: (v: number) => void
  arcCharMode: 'both' | 'new' | 'returning'
  setArcCharMode: (v: 'both' | 'new' | 'returning') => void
  sagaCharMode: 'both' | 'new' | 'returning'
  setSagaCharMode: (v: 'both' | 'new' | 'returning') => void
  wondersMode: 'arc' | 'saga'
  setWondersMode: (v: 'arc' | 'saga') => void
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
  wondersMode,
  setWondersMode,
  arcCountDist,
  sagaCountDist,
}: AppearancesSectionProps) {
  const wondersData = wondersMode === 'arc' ? arcCountDist : sagaCountDist
  const wondersDataKey = wondersMode === 'arc' ? 'arcCount' : 'sagaCount'
  const wondersFill = wondersMode === 'arc' ? '#8b5cf6' : '#ec4899'

  return (
    <>
      {/* ─── SECTION: Introduction Cadence ─── */}
      <SectionTitle title="Introduction Cadence" />

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

      {/* #6 Merged One-Arc / One-Saga Wonders */}
      <div className="mb-6">
        <ChartCard
          title="One-Arc / One-Saga Wonders vs Recurring Cast"
          description="How many arcs or sagas does each character appear in? Most characters are one-arc (or one-saga) wonders."
          downloadFileName="wonders-distribution"
          chartId="wonders-distribution"
          embedPath="/embed/insights/wonders-distribution"
          filters={
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  View by:
                </span>
                <button
                  onClick={() => setWondersMode('arc')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    wondersMode === 'arc'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Arcs
                </button>
                <button
                  onClick={() => setWondersMode('saga')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    wondersMode === 'saga'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Sagas
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="minChapters"
                  className="text-sm font-medium text-gray-700"
                >
                  Min chapters:
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
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={wondersData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={wondersDataKey}
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
              <Tooltip />
              <Bar
                dataKey="characterCount"
                fill={wondersFill}
                radius={[8, 8, 0, 0]}
                name="Characters"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(props: any) => {
                  const { x, y, width, value } = props
                  const total = wondersData.reduce(
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
    </>
  )
}

export default AppearancesSection
