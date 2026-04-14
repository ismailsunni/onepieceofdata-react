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
} from 'recharts'
import { EmbedFooter } from './EmbedFooter'
import type {
  CoverStar,
  CoverVsMain,
} from '../../services/analytics/insightsAnalytics'

// ── #17 Cover Stars ─────────────────────────────────────────────────────────

export function EmbedCoverStars({ data }: { data: CoverStar[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Top Volume Cover Stars
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
            dataKey="name"
            type="category"
            width={110}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
          />
          <Tooltip />
          <Bar
            dataKey="coverAppearances"
            fill="#f59e0b"
            name="Cover Appearances"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #18 Cover vs Main ───────────────────────────────────────────────────────

export function EmbedCoverVsMain({ data }: { data: CoverVsMain[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Volume Cover vs Main Story Appearances
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="main"
            name="Main Story Appearances"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <YAxis
            type="number"
            dataKey="cover"
            name="Volume Cover Appearances"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <Tooltip
            labelFormatter={(
              _: unknown,
              payload: ReadonlyArray<{ payload?: { name?: string } }>
            ) => payload?.[0]?.payload?.name || ''}
          />
          <Scatter data={data} fill="#8b5cf6" fillOpacity={0.5} />
        </ScatterChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}
