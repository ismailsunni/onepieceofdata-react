import { useState, useMemo } from 'react'
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
import { ChartCard } from '../common/ChartCard'
import {
  type BloodTypeBountyTierData,
  BOUNTY_TIER_LABELS,
} from '../../services/analyticsService'

interface BloodTypeBountySectionProps {
  data: BloodTypeBountyTierData[]
}

export function BloodTypeBountySection({ data }: BloodTypeBountySectionProps) {
  const [showPct, setShowPct] = useState(true)

  const pctData = useMemo(
    () =>
      data.map((r) => {
        const row: Record<string, string | number> = {
          bloodType: r.bloodType,
        }
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
    <div className="mb-6">
      <ChartCard
        title="Bounty Tier Distribution by Blood Type"
        description="Bounty power-tier breakdown by blood type. Which blood types produce the strongest pirates?"
        downloadFileName="blood-type-bounty-tier"
        chartId="blood-type-bounty-tier"
        embedPath="/embed/insights/blood-type-bounty-tier"
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowPct((v) => !v)}
            className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showPct ? 'Show counts' : 'Show %'}
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={showPct ? pctData : data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
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
              dataKey="bloodType"
              type="category"
              width={50}
              tick={{ fontSize: 11 }}
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
      </ChartCard>
    </div>
  )
}
