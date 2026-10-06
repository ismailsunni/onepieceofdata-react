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
import { EmbedFooter } from './EmbedFooter'
import type {
  GroupSize,
  CrewLoyalty,
} from '../../services/analytics/insightsAnalytics'
import { CHART_COLORS } from '../../constants/chartColors'

// ── #23 Largest Groups ──────────────────────────────────────────────────────

export function EmbedLargestGroups({ data }: { data: GroupSize[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Largest Crews &amp; Organizations
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
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
            dataKey="groupName"
            type="category"
            width={150}
            tick={{ fontSize: 9 }}
            stroke={CHART_COLORS.axis}
          />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="currentMembers"
            name="Current"
            stackId="members"
            fill={CHART_COLORS.emerald500}
          />
          <Bar
            dataKey="formerMembers"
            name="Former / Defected"
            stackId="members"
            fill={CHART_COLORS.amber500}
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #24 Crew Loyalty ────────────────────────────────────────────────────────

export function EmbedCrewLoyalty({ data }: { data: CrewLoyalty[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Crew Loyalty vs Turnover
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
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
            dataKey="groupName"
            type="category"
            width={150}
            tick={{ fontSize: 9 }}
            stroke={CHART_COLORS.axis}
          />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="current"
            name="Current"
            stackId="status"
            fill={CHART_COLORS.emerald500}
          />
          <Bar
            dataKey="former"
            name="Former"
            stackId="status"
            fill={CHART_COLORS.amber400}
          />
          <Bar
            dataKey="defected"
            name="Defected"
            stackId="status"
            fill={CHART_COLORS.red500}
          />
          <Bar
            dataKey="other"
            name="Other"
            stackId="status"
            fill={CHART_COLORS.gray400}
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}
