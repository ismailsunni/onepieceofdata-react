import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { SagaAppearanceCountData } from '../services/analyticsService'

interface SagaAppearanceCountChartProps {
  data: SagaAppearanceCountData[]
}

export function SagaAppearanceCountChart({
  data,
}: SagaAppearanceCountChartProps) {
  // Filter out entries with 0 characters for cleaner display
  const filteredData = data.filter((item) => item.characterCount > 0)

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Character Saga Appearance Distribution
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Shows how many characters appear across different numbers of sagas (e.g.,
        Doflamingo in 4 sagas, Mihawk in 7 sagas)
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={filteredData}
          margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="sagaCount"
            angle={-45}
            textAnchor="end"
            height={80}
            style={{ fontSize: '12px' }}
            label={{
              value: 'Number of Sagas',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 14, fill: '#6b7280' },
            }}
          />
          <YAxis
            label={{
              value: 'Number of Characters',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 14, fill: '#6b7280' },
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as SagaAppearanceCountData
                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    <p className="font-semibold text-gray-900">
                      {data.sagaCount}
                    </p>
                    <p className="text-sm text-gray-600">
                      {data.characterCount} character
                      {data.characterCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="characterCount" fill="#06b6d4" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
