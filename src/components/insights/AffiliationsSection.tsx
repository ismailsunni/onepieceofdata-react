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
import { SectionTitle } from './SectionTitle'
import type {
  GroupSize,
  CrewLoyalty,
} from '../../services/analytics/insightsAnalytics'

interface AffiliationsSectionProps {
  largestGroups: GroupSize[]
  crewLoyalty: CrewLoyalty[]
}

export function AffiliationsSection({
  largestGroups,
  crewLoyalty,
}: AffiliationsSectionProps) {
  return (
    <>
      {/* ─── SECTION: Affiliations ─── */}
      <SectionTitle title="Affiliations & Organizations" />

      {/* #23 Largest Crews / Organizations */}
      <div className="mb-6">
        <ChartCard
          title="Largest Crews & Organizations"
          description="Top 30 groups by total member count (current + former). Which organizations dominate the One Piece world?"
          downloadFileName="largest-groups"
          chartId="largest-groups"
          embedPath="/embed/insights/largest-groups"
        >
          <ResponsiveContainer width="100%" height={600}>
            <BarChart
              data={largestGroups}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6b7280" />
              <YAxis
                dataKey="groupName"
                type="category"
                width={150}
                tick={{ fontSize: 9 }}
                stroke="#6b7280"
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="currentMembers"
                name="Current"
                stackId="members"
                fill="#10b981"
              />
              <Bar
                dataKey="formerMembers"
                name="Former / Defected"
                stackId="members"
                fill="#f59e0b"
              />
              <Bar
                dataKey="totalMembers"
                name="Total"
                fill="transparent"
                stroke="#6b7280"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* #24 Crew Loyalty vs Turnover */}
      <div className="mb-6">
        <ChartCard
          title="Crew Loyalty vs Turnover"
          description="Membership breakdown for major groups (5+ members). How loyal are the members? Sorted by total size"
          downloadFileName="crew-loyalty"
          chartId="crew-loyalty"
          embedPath="/embed/insights/crew-loyalty"
        >
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={crewLoyalty}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6b7280" />
              <YAxis
                dataKey="groupName"
                type="category"
                width={150}
                tick={{ fontSize: 9 }}
                stroke="#6b7280"
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="current"
                name="Current"
                stackId="status"
                fill="#10b981"
              />
              <Bar
                dataKey="former"
                name="Former"
                stackId="status"
                fill="#fbbf24"
              />
              <Bar
                dataKey="defected"
                name="Defected"
                stackId="status"
                fill="#ef4444"
              />
              <Bar
                dataKey="other"
                name="Other"
                stackId="status"
                fill="#9ca3af"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
}
