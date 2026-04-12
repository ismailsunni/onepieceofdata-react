import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  type LoyalCharacter,
  type ArcCountDistribution,
  type SagaCountDistribution,
  type ArcIntroRate,
  type SagaIntroRate,
  type CharacterGap,
} from '../../services/analyticsService'
import { EmbedFooter } from './EmbedFooter'

// ── #5 Most Loyal ───────────────────────────────────────────────────────────

export function EmbedMostLoyal({ data }: { data: LoyalCharacter[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Most &quot;Loyal&quot; Characters
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            label={{
              value: 'Density (%)',
              position: 'insideBottom',
              offset: -5,
              style: { fontSize: 11, fill: '#6b7280' },
            }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={110}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Density']}
            labelFormatter={(label: string) => {
              const c = data.find((l) => l.name === label)
              return c
                ? `${label} — ${c.appearances} appearances over ${c.span} chapters`
                : label
            }}
          />
          <Bar dataKey="density" fill="#6366f1" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #6 Arc Count Distribution ───────────────────────────────────────────────

export function EmbedArcCountDistribution({
  data,
}: {
  data: ArcCountDistribution[]
}) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        One-Arc Wonders vs Recurring Cast
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="arcCount" tick={{ fontSize: 11 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
          <Tooltip />
          <Bar
            dataKey="characterCount"
            fill="#8b5cf6"
            radius={[8, 8, 0, 0]}
            name="Characters"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => {
              const { x, y, width, value } = props
              const total = data.reduce((s, d) => s + d.characterCount, 0)
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <text
                  x={x + width / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#374151"
                >
                  {value} ({pct}%)
                </text>
              )
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #6b Saga Count Distribution ─────────────────────────────────────────────

export function EmbedSagaCountDistribution({
  data,
}: {
  data: SagaCountDistribution[]
}) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        One-Saga Wonders vs Recurring Cast
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="sagaCount" tick={{ fontSize: 11 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
          <Tooltip />
          <Bar
            dataKey="characterCount"
            fill="#ec4899"
            radius={[8, 8, 0, 0]}
            name="Characters"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={(props: any) => {
              const { x, y, width, value } = props
              const total = data.reduce((s, d) => s + d.characterCount, 0)
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <text
                  x={x + width / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#374151"
                >
                  {value} ({pct}%)
                </text>
              )
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #7 Arc Intro Rate ───────────────────────────────────────────────────────

export function EmbedArcIntroRate({ data }: { data: ArcIntroRate[] }) {
  const [mode, setMode] = useState<'both' | 'new' | 'returning'>('both')

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Characters per Arc (New vs Returning)
        </h2>
        <div className="flex items-center gap-2">
          {(['both', 'new', 'returning'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {m === 'both' ? 'Both' : m === 'new' ? 'New' : 'Returning'}
            </button>
          ))}
        </div>
      </div>
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
            labelFormatter={(label: string) => {
              const d = data.find((a) => a.arc === label)
              return `${label} (${d?.saga || 'Unknown'})`
            }}
          />
          <Legend />
          {(mode === 'both' || mode === 'returning') && (
            <Bar
              dataKey="returningCharacters"
              name="Returning Characters"
              stackId="characters"
              fill="#f59e0b"
              radius={mode === 'returning' ? [4, 4, 0, 0] : undefined}
            />
          )}
          {(mode === 'both' || mode === 'new') && (
            <Bar
              dataKey="newCharacters"
              name="New Characters"
              stackId="characters"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #7b Saga Intro Rate ─────────────────────────────────────────────────────

export function EmbedSagaIntroRate({ data }: { data: SagaIntroRate[] }) {
  const [mode, setMode] = useState<'both' | 'new' | 'returning'>('both')

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Characters per Saga (New vs Returning)
        </h2>
        <div className="flex items-center gap-2">
          {(['both', 'new', 'returning'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {m === 'both' ? 'Both' : m === 'new' ? 'New' : 'Returning'}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="saga"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={100}
            stroke="#6b7280"
          />
          <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
          <Tooltip />
          <Legend />
          {(mode === 'both' || mode === 'returning') && (
            <Bar
              dataKey="returningCharacters"
              name="Returning Characters"
              stackId="characters"
              fill="#f59e0b"
              radius={mode === 'returning' ? [4, 4, 0, 0] : undefined}
            />
          )}
          {(mode === 'both' || mode === 'new') && (
            <Bar
              dataKey="newCharacters"
              name="New Characters"
              stackId="characters"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #8 Gap Analysis ─────────────────────────────────────────────────────────

export function EmbedGapAnalysis({ data }: { data: CharacterGap[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Longest Disappearances
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-3 font-semibold text-gray-900">
                Character
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                Gap (chapters)
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                From Ch.
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                To Ch.
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-900">
                Total Appearances
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((g, i) => (
              <tr
                key={g.name}
                className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
              >
                <td className="py-2 px-3 font-medium text-gray-900">
                  {g.name}
                </td>
                <td className="py-2 px-3 text-right font-bold text-red-600">
                  {g.gapLength}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {g.gapStart}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {g.gapEnd}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {g.totalAppearances}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EmbedFooter />
    </div>
  )
}
