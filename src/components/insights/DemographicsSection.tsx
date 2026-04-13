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
import { ChartCard } from '../common/ChartCard'
import { SAGA_COLORS } from './constants'
import type {
  BloodTypeDistribution,
  RegionCount,
  AgeStatusBucket,
} from '../../services/analytics/insightsAnalytics'

interface DemographicsSectionProps {
  bloodType: BloodTypeDistribution[]
  ageDistribution: AgeStatusBucket[]
}

export function DemographicsSection({
  bloodType,
  ageDistribution,
}: DemographicsSectionProps) {
  return (
    <>
      {/* Age Distribution by Status */}
      <div className="mb-6">
        <ChartCard
          title="Age Distribution by Status"
          description="Histogram of character ages colored by alive/deceased. Is there an 'age of death' cluster?"
          downloadFileName="age-distribution"
          chartId="age-distribution"
          embedPath="/embed/insights/age-distribution"
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={ageDistribution}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="ageRange"
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="alive" stackId="a" fill="#10b981" name="Alive" />
              <Bar
                dataKey="deceased"
                stackId="a"
                fill="#ef4444"
                name="Deceased"
              />
              <Bar
                dataKey="unknown"
                stackId="a"
                fill="#9ca3af"
                name="Unknown"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Blood Type Distribution */}
      <div className="mb-6">
        <ChartCard
          title="Blood Type Distribution"
          description="One Piece uses fictional blood types (X, F, XF, S) instead of the real-world ABO system. How common is each?"
          downloadFileName="blood-type-comparison"
          chartId="blood-type-comparison"
          embedPath="/embed/insights/blood-type-comparison"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={bloodType}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="bloodType"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
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
                formatter={(value: number, _name: string, props: { payload?: { percent?: number } }) => [
                  `${value} (${props?.payload?.percent ?? 0}%)`,
                  'Characters',
                ]}
              />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                name="Characters"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
}

interface OriginRegionBubbleProps {
  regionCounts: RegionCount[]
}

export function OriginRegionBubble({ regionCounts }: OriginRegionBubbleProps) {
  return (
    <div className="mb-6">
      <ChartCard
        title="Origin Region Distribution"
        description="Which regions of the One Piece world are most represented? (Top 15)"
        downloadFileName="origin-regions"
        chartId="origin-regions"
        embedPath="/embed/insights/origin-regions"
      >
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={regionCounts.slice(0, 15).map((r) => ({
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
              {regionCounts.slice(0, 15).map((_, i) => (
                <Cell key={i} fill={SAGA_COLORS[i % SAGA_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
