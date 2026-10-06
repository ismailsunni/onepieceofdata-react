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
import { CHART_COLORS } from '../constants/chartColors'

interface CharacterAppearanceChartProps {
  data: AppearanceData[]
}

function CharacterAppearanceChart({ data }: CharacterAppearanceChartProps) {
  return (
    <ChartCard
      title="Character Appearances Distribution"
      downloadFileName="character-appearances"
      chartId="character-appearances"
    >
      <p className="text-sm text-gray-600 mb-4">
        Number of characters by their chapter appearance count
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="chapterRange"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            stroke={CHART_COLORS.axis}
            label={{
              value: 'Chapter Appearances',
              position: 'insideBottom',
              offset: -20,
              style: { fontSize: 14, fill: CHART_COLORS.gray500 },
            }}
          />
          <YAxis
            label={{
              value: 'Number of Characters',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fill: CHART_COLORS.axis },
            }}
            tick={{ fontSize: 12 }}
            stroke={CHART_COLORS.gray500}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.white,
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
            formatter={(value: number) => [`${value} characters`, 'Count']}
          />
          <Bar
            dataKey="characterCount"
            fill={CHART_COLORS.violet500}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default CharacterAppearanceChart
