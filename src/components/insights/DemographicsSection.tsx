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
import { SAGA_COLORS } from './constants'
import type {
  BloodTypeDistribution,
  RegionCount,
  AgeStatusBucket,
} from '../../services/analytics/insightsAnalytics'
import { CHART_COLORS } from '../../constants/chartColors'

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
                ) => [
                  `${value} (${props?.payload?.percent ?? 0}%)`,
                  'Characters',
                ]}
              />
              <Bar
                dataKey="count"
                fill={CHART_COLORS.blue500}
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
        <ResponsiveContainer width="100%" height={450}>
          <BarChart
            data={regionCounts.slice(0, 15)}
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
              {regionCounts.slice(0, 15).map((_, i) => (
                <Cell key={i} fill={SAGA_COLORS[i % SAGA_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
