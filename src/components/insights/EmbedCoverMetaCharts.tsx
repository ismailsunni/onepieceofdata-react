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
  Cell,
} from 'recharts'
import { EmbedFooter } from './EmbedFooter'
import type {
  CoverStar,
  CoverVsMain,
  ArcDensity,
  CompletenessField,
} from '../../services/analytics/insightsAnalytics'

// ── #17 Cover Stars ─────────────────────────────────────────────────────────

export function EmbedCoverStars({ data }: { data: CoverStar[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Top Volume Cover Stars
      </h2>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
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
      <ResponsiveContainer width="100%" height={400}>
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

// ── #19 Arc Density ─────────────────────────────────────────────────────────

export function EmbedArcDensity({ data }: { data: ArcDensity[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Character Cast Size per Arc
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="arc"
            tick={{ fontSize: 9 }}
            angle={-45}
            textAnchor="end"
            height={100}
            stroke="#6b7280"
          />
          <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'uniqueCharacters'
                ? [value, 'Unique Characters']
                : [value, name]
            }
          />
          <Bar
            dataKey="uniqueCharacters"
            fill="#06b6d4"
            name="Unique Characters"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #20 Data Completeness ───────────────────────────────────────────────────

export function EmbedDataCompleteness({ data }: { data: CompletenessField[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        The Completeness Gap
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="field" tick={{ fontSize: 11 }} stroke="#6b7280" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            domain={[0, 100]}
            label={{
              value: '%',
              position: 'insideTopLeft',
              style: { fontSize: 11, fill: '#6b7280' },
            }}
          />
          <Tooltip
            formatter={(
              value: number,
              _name: string,
              props: { payload?: CompletenessField }
            ) => [
              `${value}% (${props.payload?.filled || 0}/${props.payload?.total || 0})`,
              'Completeness',
            ]}
          />
          <Bar dataKey="percent" name="Completeness" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.percent >= 80
                    ? '#10b981'
                    : entry.percent >= 50
                      ? '#f59e0b'
                      : '#ef4444'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}
