import { useRef } from 'react'
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
import { DownloadChartButton } from './common/DownloadChartButton'

interface SagaAppearanceChartProps {
  data: SagaAppearanceData[]
}

// Color palette for the sagas
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
]

export function SagaAppearanceChart({ data }: SagaAppearanceChartProps) {
  // Truncate saga names for better display
  const chartRef = useRef<HTMLDivElement>(null)
  const chartData = data.map((item) => ({
    ...item,
    displayName:
      item.sagaName.length > 20
        ? item.sagaName.substring(0, 20) + '...'
        : item.sagaName,
  }))

  return (
    <div className="relative w-full">
      <div className="absolute right-2 top-0 z-10">
        <DownloadChartButton chartRef={chartRef} fileName="saga-appearances" />
      </div>
      {/* 
        We attach the ref to a container that wraps the ResponsiveContainer.
        We add 'bg-white' class to ensure the captured image has a white background 
        if the option in toPng doesn't catch everything, though toPng({backgroundColor: 'white'}) 
        replaces transparent pixels. 
        Padding ensures labels aren't cut off if slightly outside standard bounds.
      */}
      <div ref={chartRef} className="rounded-lg bg-white p-4">
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
                      <p className="font-semibold text-gray-900">{data.sagaName}</p>
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
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
