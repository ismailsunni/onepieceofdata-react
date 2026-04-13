import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import SortableTable from '../common/SortableTable'
import { STRAW_HAT_IDS } from '../../constants/characters'
import {
  type ChapterComplexityPoint,
  type BountyVsAppearance,
  type BountyJump,
  type RegionBountyTierData,
  type BountyRange,
  type TopBounty,
  BOUNTY_TIER_LABELS,
  fetchBountyDistribution,
  fetchTopBounties,
  fetchRegionBountyData,
} from '../../services/analyticsService'
import { formatBounty, bountyJumpColumns } from './constants'
import { EmbedFooter } from './EmbedFooter'

// ── #1 Cast Complexity ──────────────────────────────────────────────────────

export function EmbedCastComplexity({
  data,
}: {
  data: ChapterComplexityPoint[]
}) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Cast Complexity Over Time
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="chapter"
            type="number"
            domain={[1, 'dataMax']}
            ticks={[1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100]}
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
              const d = data.find((p) => p.chapter === label)
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
      <EmbedFooter />
    </div>
  )
}

// ── #2 Bounty vs Appearance ─────────────────────────────────────────────────

export function EmbedBountyVsAppearance({
  data,
}: {
  data: BountyVsAppearance[]
}) {
  const [hideStrawHats, setHideStrawHats] = useState(true)
  const filtered = hideStrawHats
    ? data.filter((d) => !STRAW_HAT_IDS.has(d.id))
    : data

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Bounty vs Appearance Count
        </h2>
        <button
          onClick={() => setHideStrawHats((v) => !v)}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            hideStrawHats
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {hideStrawHats ? 'SHP Hidden' : 'Hide SHP'}
        </button>
      </div>
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
          <Scatter data={filtered} fill="#6366f1" fillOpacity={0.6}>
            {filtered.map((entry, i) => (
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
      <EmbedFooter />
    </div>
  )
}

// ── #3 Bounty Jumps ─────────────────────────────────────────────────────────

export function EmbedBountyJumps({ data }: { data: BountyJump[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Bounty Jumps</h2>
      {data.length > 0 ? (
        <SortableTable<BountyJump>
          columns={bountyJumpColumns}
          data={data}
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
      <EmbedFooter />
    </div>
  )
}

// ── #4 Region Bounty Tier ───────────────────────────────────────────────────

export function EmbedRegionBountyTier({
  data,
}: {
  data: RegionBountyTierData[]
}) {
  const [showPct, setShowPct] = useState(true)

  const pctData = useMemo(
    () =>
      data.map((r) => {
        const row: Record<string, string | number> = { region: r.region }
        if (r.total <= 0) {
          for (const { label } of BOUNTY_TIER_LABELS) row[label] = 0
          return row
        }
        const raw: { label: string; pct: number }[] = BOUNTY_TIER_LABELS.map(
          ({ label }) => {
            const v = (r[label] as number) || 0
            return { label, pct: Math.round((v / r.total) * 1000) / 10 }
          }
        )
        const sum = raw.reduce((s, t) => s + t.pct, 0)
        if (sum !== 100) {
          const largest = raw.reduce((a, b) => (b.pct > a.pct ? b : a))
          largest.pct = Math.round((largest.pct + (100 - sum)) * 10) / 10
        }
        for (const t of raw) row[t.label] = t.pct
        return row
      }),
    [data]
  )

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Bounty Tier Distribution by Region
        </h2>
        <button
          onClick={() => setShowPct((v) => !v)}
          className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {showPct ? 'Show counts' : 'Show %'}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={showPct ? pctData : data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            domain={showPct ? [0, 100] : [0, 'auto']}
            allowDataOverflow={showPct}
            tickFormatter={showPct ? (v) => `${v}%` : undefined}
          />
          <YAxis
            dataKey="region"
            type="category"
            width={90}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value: number) => (showPct ? `${value}%` : value)}
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
      <EmbedFooter />
    </div>
  )
}

// ── Loading / Empty helpers ─────────────────────────────────────────────────

function EmbedLoading() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

// ── Bounty Distribution by Power Tier ───────────────────────────────────────

export function EmbedBountyDistribution() {
  const { data, isLoading } = useQuery<BountyRange[]>({
    queryKey: ['embed', 'bounty-distribution'],
    queryFn: fetchBountyDistribution,
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) return <EmbedLoading />
  const rows = data ?? []

  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Bounty Distribution by Power Tier
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={rows}
          margin={{ top: 10, right: 20, left: 10, bottom: 70 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="range"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value} characters`,
              name === 'alive' ? 'Alive' : 'Deceased/Unknown',
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const tier = (payload[0].payload as BountyRange).powerTier
                return `${tier} (${label})`
              }
              return label
            }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(v) => (v === 'alive' ? 'Alive' : 'Deceased/Unknown')}
          />
          <Bar dataKey="alive" stackId="a" fill="#10b981" />
          <Bar dataKey="notAlive" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── Top 10 Highest Bounties ─────────────────────────────────────────────────

export function EmbedTopBounties() {
  const [aliveOnly, setAliveOnly] = useState(false)
  const { data, isLoading } = useQuery<TopBounty[]>({
    queryKey: ['embed', 'top-bounties', aliveOnly],
    queryFn: () => fetchTopBounties(10, aliveOnly),
    staleTime: 10 * 60 * 1000,
  })

  const rows = data ?? []
  const statusColor = (s: string | null) =>
    s === 'Alive' ? '#10b981' : '#ef4444'

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Top 10 Highest Bounties
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAliveOnly(false)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              !aliveOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setAliveOnly(true)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              aliveOnly
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alive Only
          </button>
        </div>
      </div>
      {isLoading ? (
        <EmbedLoading />
      ) : (
        <ResponsiveContainer width="100%" height={420}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 110, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              tickFormatter={formatBounty}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 10 }}
              stroke="#6b7280"
            />
            <Tooltip
              formatter={(value: number) => [
                `฿${value.toLocaleString()}`,
                'Bounty',
              ]}
              labelFormatter={(label: string) => {
                const c = rows.find((d) => d.name === label)
                const status = c?.status ? ` - ${c.status}` : ''
                return c?.origin ? `${label} (${c.origin})${status}` : `${label}${status}`
              }}
            />
            <Bar dataKey="bounty" radius={[0, 8, 8, 0]}>
              {rows.map((entry, i) => (
                <Cell key={i} fill={statusColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <EmbedFooter />
    </div>
  )
}

// ── Region Bounty Breakdown Table ───────────────────────────────────────────

export function EmbedRegionBountyTable() {
  const [excludeDead, setExcludeDead] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['embed', 'region-bounty', excludeDead],
    queryFn: () => fetchRegionBountyData(excludeDead),
    staleTime: 10 * 60 * 1000,
  })

  const rows = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => b.totalBounty - a.totalBounty)
  }, [data])

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          Region Bounty Breakdown
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">
            Include deceased:
          </span>
          <button
            onClick={() => setExcludeDead(false)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              !excludeDead
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => setExcludeDead(true)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              excludeDead
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alive Only
          </button>
        </div>
      </div>
      {isLoading ? (
        <EmbedLoading />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-900">
                  Region
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-900">
                  Characters
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-900">
                  Total Bounty
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-900">
                  Average
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-900">
                  Median
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.region}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                >
                  <td className="py-2 px-3 font-medium text-gray-900">
                    {r.region}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-700">
                    {r.characterCount}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-amber-600">
                    ฿{formatBounty(r.totalBounty)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-purple-600">
                    ฿{formatBounty(r.averageBounty)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-blue-600">
                    ฿{formatBounty(r.medianBounty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <EmbedFooter />
    </div>
  )
}
