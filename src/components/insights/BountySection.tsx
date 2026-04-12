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
} from 'recharts'
import { ChartCard } from '../common/ChartCard'
import SortableTable from '../common/SortableTable'
import { STRAW_HAT_IDS } from '../../constants/characters'
import {
  type ChapterComplexityPoint,
  type BountyVsAppearance,
  type BountyJump,
  type RegionBountyTierData,
  BOUNTY_TIER_LABELS,
} from '../../services/analyticsService'
import { formatBounty, bountyJumpColumns } from './constants'
import { SectionTitle } from './SectionTitle'

export interface BountySectionProps {
  insights: {
    chapterComplexity: ChapterComplexityPoint[]
    bountyVsAppearance: BountyVsAppearance[]
    topBountyJumps: BountyJump[]
  }
  hideStrawHats: boolean
  onToggleHideStrawHats: () => void
  bountyTierPercent: boolean
  onToggleBountyTierPercent: () => void
  regionBountyTierCount: RegionBountyTierData[]
  regionBountyTierPct: Record<string, string | number>[]
}

export function BountySection({
  insights,
  hideStrawHats,
  onToggleHideStrawHats,
  bountyTierPercent,
  onToggleBountyTierPercent,
  regionBountyTierCount,
  regionBountyTierPct,
}: BountySectionProps) {
  return (
    <>
      {/* ─── SECTION: Bounty & Power ─── */}
      <SectionTitle title="Bounty & Power" />

      {/* #1 Characters per Chapter Over Time */}
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

      {/* #2 Bounty vs Appearance Count */}
      <div className="mb-6">
        <ChartCard
          title="Bounty vs Appearance Count"
          description="Do high-bounty characters appear more often? Scatter plot of bounty vs chapter appearances"
          downloadFileName="bounty-vs-appearance"
          chartId="bounty-vs-appearance"
          embedPath="/embed/insights/bounty-vs-appearance"
          filters={
            <button
              onClick={onToggleHideStrawHats}
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
            <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
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
          title="Bounty Jumps"
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
          title="Bounty Tier Distribution by Region"
          description="Bounty power-tier breakdown by origin region (regions with 3+ bounty holders). Which regions produce the strongest pirates?"
          downloadFileName="region-bounty-tier"
          chartId="region-bounty-tier"
          embedPath="/embed/insights/region-bounty-tier"
        >
          <div className="flex justify-end mb-2">
            <button
              onClick={onToggleBountyTierPercent}
              className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {bountyTierPercent ? 'Show counts' : 'Show %'}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={
                bountyTierPercent ? regionBountyTierPct : regionBountyTierCount
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
    </>
  )
}

export default BountySection
