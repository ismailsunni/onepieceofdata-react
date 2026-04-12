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
import { ChartCard } from '../common/ChartCard'
import { SectionTitle } from './SectionTitle'
import type {
  CoverStar,
  CoverVsMain,
  ArcDensity,
  CompletenessField,
} from '../../services/analytics/insightsAnalytics'

interface CoverMetaSectionProps {
  coverStars: CoverStar[]
  coverVsMain: CoverVsMain[]
  arcDensity: ArcDensity[]
  completeness: CompletenessField[]
}

export function CoverMetaSection({
  coverStars,
  coverVsMain,
  arcDensity,
  completeness,
}: CoverMetaSectionProps) {
  return (
    <>
      {/* ─── SECTION: Cover Stories & Meta ─── */}
      <SectionTitle title="Cover Stories & Meta" />

      {/* #17 Cover Page Stars */}
      <div className="mb-6">
        <ChartCard
          title="Cover Page Stars"
          description="Top 20 characters by cover story appearances"
          downloadFileName="cover-stars"
          chartId="cover-stars"
          embedPath="/embed/insights/cover-stars"
        >
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={coverStars}
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
        </ChartCard>
      </div>

      {/* #18 Cover vs Main */}
      <div className="mb-6">
        <ChartCard
          title="Cover vs Main Story Appearances"
          description="Some characters live mostly in cover stories. Scatter plot comparing both appearance types"
          downloadFileName="cover-vs-main"
          chartId="cover-vs-main"
          embedPath="/embed/insights/cover-vs-main"
        >
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="main"
                name="Main Story"
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <YAxis
                type="number"
                dataKey="cover"
                name="Cover"
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <Tooltip
                labelFormatter={(
                  _: unknown,
                  payload: ReadonlyArray<{ payload?: { name?: string } }>
                ) => payload?.[0]?.payload?.name || ''}
              />
              <Scatter data={coverVsMain} fill="#8b5cf6" fillOpacity={0.5} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* #19 Arc Density */}
      <div className="mb-6">
        <ChartCard
          title="Character Cast Size per Arc"
          description="Which arcs have the most characters active in them?"
          downloadFileName="arc-density"
          chartId="arc-density"
          embedPath="/embed/insights/arc-density"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={arcDensity}
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
        </ChartCard>
      </div>

      {/* #20 Data Completeness */}
      <div className="mb-6">
        <ChartCard
          title="The Completeness Gap"
          description="What percentage of characters have each attribute filled? A meta-visualization about the dataset itself"
          downloadFileName="data-completeness"
          chartId="data-completeness"
          embedPath="/embed/insights/data-completeness"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={completeness}
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
                {completeness.map((entry, i) => (
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
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>{' '}
              {'>='}80%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>{' '}
              50-80%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>{' '}
              {'<'}50%
            </span>
          </div>
        </ChartCard>
      </div>
    </>
  )
}
