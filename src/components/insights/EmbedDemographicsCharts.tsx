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
  BloodTypeDistribution,
  RegionCount,
  AgeStatusBucket,
} from '../../services/analytics/insightsAnalytics'
import { CHART_COLORS } from '../../constants/chartColors'

// ── #13 Blood Type Distribution ─────────────────────────────────────────────

export function EmbedBloodTypeComparison({
  data,
}: {
  data: BloodTypeDistribution[]
}) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Blood Type Distribution
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="bloodType"
            tick={{ fontSize: 12 }}
            stroke={CHART_COLORS.axis}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke={CHART_COLORS.axis}
            label={{
              value: 'Characters',
              angle: -90,
              position: 'insideLeft',
              style: {
                fontSize: 11,
                fill: CHART_COLORS.gray500,
                textAnchor: 'middle',
              },
            }}
          />
          <Tooltip
            formatter={(
              value: number,
              _name: string,
              props: { payload?: { percent?: number } }
            ) => [`${value} (${props?.payload?.percent ?? 0}%)`, 'Characters']}
          />
          <Legend />
          <Bar
            dataKey="count"
            fill={CHART_COLORS.blue500}
            name="Characters"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #15 Origin Regions ──────────────────────────────────────────────────────

export function EmbedOriginRegions({ data }: { data: RegionCount[] }) {
  const top15 = data.slice(0, 15)
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Origin Region Distribution
      </h2>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart
          data={top15}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            stroke={CHART_COLORS.axis}
          />
          <YAxis
            dataKey="region"
            type="category"
            width={120}
            tick={{ fontSize: 10 }}
            stroke={CHART_COLORS.axis}
          />
          <Tooltip
            formatter={(value: number) => [`${value} characters`, 'Count']}
          />
          <Bar
            dataKey="count"
            fill={CHART_COLORS.blue500}
            name="Characters"
            radius={[0, 8, 8, 0]}
          >
            {top15.map((_, i) => (
              <Cell key={i} fill={SAGA_COLORS[i % SAGA_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #16 Age Distribution ────────────────────────────────────────────────────

export function EmbedAgeDistribution({ data }: { data: AgeStatusBucket[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Age Distribution by Status
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="ageRange"
            tick={{ fontSize: 11 }}
            stroke={CHART_COLORS.axis}
          />
          <YAxis tick={{ fontSize: 11 }} stroke={CHART_COLORS.axis} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="alive"
            stackId="a"
            fill={CHART_COLORS.emerald500}
            name="Alive"
          />
          <Bar
            dataKey="deceased"
            stackId="a"
            fill={CHART_COLORS.red500}
            name="Deceased"
          />
          <Bar
            dataKey="unknown"
            stackId="a"
            fill={CHART_COLORS.gray400}
            name="Unknown"
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}
