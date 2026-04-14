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
          <Bar dataKey="former" name="Former" stackId="status" fill="#fbbf24" />
          <Bar
            dataKey="defected"
            name="Defected"
            stackId="status"
            fill="#ef4444"
          />
          <Bar dataKey="other" name="Other" stackId="status" fill="#9ca3af" />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}
