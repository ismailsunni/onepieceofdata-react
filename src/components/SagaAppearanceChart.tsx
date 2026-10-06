import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { SagaAppearanceData } from '../services/analyticsService'
import { ChartCard } from './common/ChartCard'
import { CHART_COLORS } from '../constants/chartColors'

interface SagaAppearanceChartProps {
  data: SagaAppearanceData[]
}

// Color palette for the sagas
const COLORS = [
  CHART_COLORS.blue500, // blue-500
  CHART_COLORS.emerald500, // green-500
  CHART_COLORS.amber500, // amber-500
  CHART_COLORS.red500, // red-500
  CHART_COLORS.violet500, // violet-500
  CHART_COLORS.pink500, // pink-500
  CHART_COLORS.cyan500, // cyan-500
  CHART_COLORS.lime500, // lime-500
  CHART_COLORS.orange500, // orange-500
  CHART_COLORS.indigo500, // indigo-500
  CHART_COLORS.teal500, // teal-500
]

export function SagaAppearanceChart({ data }: SagaAppearanceChartProps) {
  // Truncate saga names for better display
  const chartData = data.map((item) => ({
    ...item,
    displayName:
      item.sagaName.length > 20
        ? item.sagaName.substring(0, 20) + '...'
        : item.sagaName,
  }))

  return (
    <ChartCard
      title="Character Appearances by Saga"
      downloadFileName="saga-appearances"
      chartId="saga-appearances"
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 60, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="displayName"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            label={{
              value: 'Number of Characters',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as SagaAppearanceData & {
                  displayName: string
                }
                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    <p className="font-semibold text-gray-900">
                      {data.sagaName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Characters: {data.characterCount}
                    </p>
                    <p className="text-xs text-gray-500">
                      Saga {data.sagaOrder} of 11
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="characterCount" radius={[8, 8, 0, 0]}>
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
