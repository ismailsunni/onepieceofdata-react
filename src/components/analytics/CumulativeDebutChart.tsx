import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  type CumulativeDebutSeries,
  type DebutGranularity,
} from '../../services/analyticsService'

const GRANULARITIES: { value: DebutGranularity; label: string }[] = [
  { value: 'chapter', label: 'Chapter' },
  { value: 'arc', label: 'Arc' },
  { value: 'saga', label: 'Saga' },
]

interface ControlsProps {
  granularity: DebutGranularity
  setGranularity: (g: DebutGranularity) => void
  filterOn: boolean
  setFilterOn: (v: boolean) => void
  hiddenCount: number
  size?: 'sm' | 'md'
}

export function CumulativeDebutControls({
  granularity,
  setGranularity,
  filterOn,
  setFilterOn,
  hiddenCount,
  size = 'md',
}: ControlsProps) {
  const noun = granularity
  const btn = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  const text = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Granularity segmented control */}
      <div
        role="group"
        aria-label="X-axis granularity"
        className="flex items-center gap-1 bg-gray-100 rounded-lg p-1"
      >
        {GRANULARITIES.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => setGranularity(g.value)}
            aria-pressed={granularity === g.value}
            className={`${btn} rounded-md transition-colors ${
              granularity === g.value
                ? 'bg-white text-emerald-700 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Filter toggle */}
      <label
        className={`inline-flex items-center gap-2 ${text} text-gray-700 cursor-pointer`}
      >
        <input
          type="checkbox"
          checked={filterOn}
          onChange={(e) => setFilterOn(e.target.checked)}
          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        Hide one-{noun}-only characters
      </label>

      {/* Hidden / single-bucket count */}
      <span className={`${text} text-gray-500`}>
        {filterOn
          ? `Hiding ${hiddenCount.toLocaleString()} one-${noun} character${hiddenCount === 1 ? '' : 's'}`
          : `${hiddenCount.toLocaleString()} character${hiddenCount === 1 ? '' : 's'} appear in a single ${noun}`}
      </span>
    </div>
  )
}

interface ChartBodyProps {
  series: CumulativeDebutSeries
  granularity: DebutGranularity
  height?: number
}

export function CumulativeDebutChartBody({
  series,
  granularity,
  height,
}: ChartBodyProps) {
  const isChapter = granularity === 'chapter'
  const resolvedHeight = height ?? 460
  // Reserve the same x-axis band in every mode so the plotted area — and thus
  // the perceived chart height — stays constant when switching granularity.
  const X_AXIS_BAND = 140

  return (
    <ResponsiveContainer width="100%" height={resolvedHeight}>
      <LineChart
        data={series.points}
        margin={{ top: 5, right: 30, left: 10, bottom: 6 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        {isChapter ? (
          <XAxis
            dataKey="x"
            type="number"
            domain={[1, 'dataMax']}
            height={X_AXIS_BAND}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            label={{
              value: 'Chapter',
              position: 'insideBottom',
              offset: 12,
              style: { fontSize: 12, fill: '#6b7280' },
            }}
          />
        ) : (
          <XAxis
            dataKey="label"
            type="category"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={X_AXIS_BAND}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
        )}
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="#6b7280"
          allowDecimals={false}
          width={48}
          label={{
            value: 'Characters debuted',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: 12, fill: '#6b7280', textAnchor: 'middle' },
          }}
        />
        <Tooltip
          labelFormatter={(_label, payload) =>
            payload && payload.length ? payload[0].payload.label : ''
          }
          formatter={(value, _name, item) => {
            const total = Number(value) || 0
            const delta = (item?.payload?.delta as number) ?? 0
            return [
              `${total.toLocaleString()} total (+${delta.toLocaleString()} new)`,
              'Debuted',
            ]
          }}
        />
        <Line
          type="monotone"
          dataKey="cumulative"
          name="Cumulative debuts"
          stroke="#059669"
          strokeWidth={2}
          dot={isChapter ? false : { r: 3, fill: '#059669' }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
