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
import { OriginRegionData } from '../services/analyticsService'
import { ChartCard } from './common/ChartCard'

interface OriginRegionChartProps {
  data: OriginRegionData[]
}

const BAR_COLOR = '#6366f1' // indigo-500

function OriginRegionChart({ data }: OriginRegionChartProps) {
  return (
    <ChartCard
      title="Characters by Origin Region"
      description="Number of characters from each region of the One Piece world"
      downloadFileName="origin-region-distribution"
    >
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="region"
            width={130}
            tick={{ fontSize: 12, fill: '#374151' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
            formatter={(value: number) => [`${value} characters`, 'Count']}
            cursor={{ fill: '#f3f4f6' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BAR_COLOR}
                fillOpacity={1 - index * (0.5 / Math.max(data.length, 1))}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default OriginRegionChart
