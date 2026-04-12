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
import { SectionTitle } from './SectionTitle'
import { SAGA_COLORS } from './constants'
import type {
  BloodTypeComparison,
  BirthdayMonth,
  RegionCount,
  AgeStatusBucket,
} from '../../services/analytics/insightsAnalytics'

interface DemographicsSectionProps {
  bloodType: BloodTypeComparison[]
  birthdays: BirthdayMonth[]
  regionCounts: RegionCount[]
  ageDistribution: AgeStatusBucket[]
}

export function DemographicsSection({
  bloodType,
  birthdays,
  regionCounts,
  ageDistribution,
}: DemographicsSectionProps) {
  return (
    <>
      {/* ─── SECTION: Demographics ─── */}
      <SectionTitle title="Demographics & World-Building" />

      {/* #13 Blood Type Distribution */}
      <div className="mb-6">
        <ChartCard
          title="Blood Type: One Piece vs Japan"
          description="Does Oda follow real-world Japanese blood type distribution?"
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
                  value: '%',
                  position: 'insideTopLeft',
                  style: { fontSize: 11, fill: '#6b7280' },
                }}
              />
              <Tooltip formatter={(value: number) => [`${value}%`]} />
              <Legend />
              <Bar
                dataKey="opPercent"
                fill="#3b82f6"
                name="One Piece"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="japanPercent"
                fill="#f59e0b"
                name="Japan (Real)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* #14 Birthday Distribution */}
      <div className="mb-6">
        <ChartCard
          title="Birthday Calendar by Month"
          description="Which months have the most character birthdays?"
          downloadFileName="birthday-distribution"
          chartId="birthday-distribution"
          embedPath="/embed/insights/birthday-distribution"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={birthdays}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#ec4899"
                name="Birthdays"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* #15 Origin Region */}
      <div className="mb-6">
        <ChartCard
          title="Origin Region Bubble Chart"
          description="Which regions of the One Piece world are most represented?"
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

      {/* #16 Age Distribution by Status */}
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
    </>
  )
}
