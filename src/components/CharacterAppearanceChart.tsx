import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { AppearanceData } from '../services/analyticsService'
import { ChartCard } from './common/ChartCard'

interface CharacterAppearanceChartProps {
  data: AppearanceData[]
}

function CharacterAppearanceChart({ data }: CharacterAppearanceChartProps) {
  return (
    <ChartCard
      title="Character Appearances Distribution"
      downloadFileName="character-appearances"
    >
      <p className="text-sm text-gray-600 mb-4">
        Number of characters by their chapter appearance count
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="chapterRange"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{
              value: 'Chapter Appearances',
              position: 'insideBottom',
              offset: -20,
              style: { fontSize: 14, fill: '#6b7280' },
            }}
          />
          <YAxis
            label={{
              value: 'Number of Characters',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fill: '#6b7280' },
            }}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
            formatter={(value: number) => [`${value} characters`, 'Count']}
          />
          <Bar
            dataKey="characterCount"
            fill="#8b5cf6"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default CharacterAppearanceChart
