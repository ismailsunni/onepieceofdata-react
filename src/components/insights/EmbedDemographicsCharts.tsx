import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { EmbedFooter } from './EmbedFooter'
import { SAGA_COLORS } from './constants'
import type {
  BloodTypeDistribution,
  RegionCount,
  AgeStatusBucket,
} from '../../services/analytics/insightsAnalytics'

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
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="bloodType" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            label={{
              value: 'Characters',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#6b7280', textAnchor: 'middle' },
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
            fill="#3b82f6"
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
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Origin Region Bubble Chart
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.slice(0, 15).map((r) => ({
              ...r,
              [r.region]: r.count,
            }))}
            dataKey="count"
            nameKey="region"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={(props: {
              region?: string
              count?: number
              name?: string
              value?: number
            }) =>
              `${props.region || props.name || ''} (${props.count ?? props.value ?? 0})`
            }
            labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
          >
            {data.slice(0, 15).map((_, i) => (
              <Cell key={i} fill={SAGA_COLORS[i % SAGA_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="ageRange" tick={{ fontSize: 11 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
          <Tooltip />
          <Legend />
          <Bar dataKey="alive" stackId="a" fill="#10b981" name="Alive" />
          <Bar dataKey="deceased" stackId="a" fill="#ef4444" name="Deceased" />
          <Bar dataKey="unknown" stackId="a" fill="#9ca3af" name="Unknown" />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}
