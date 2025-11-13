import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Arc } from '../types/arc'

interface ArcLengthChartProps {
  arcs: Arc[]
}

function ArcLengthChart({ arcs }: ArcLengthChartProps) {
  // Transform arc data for the chart
  const chartData = arcs.map((arc) => ({
    name: arc.title,
    chapters: arc.end_chapter - arc.start_chapter + 1,
  }))

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Arc Length by Number of Chapters
      </h3>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 60, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            label={{
              value: 'Number of Chapters',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 14, fill: '#6b7280', textAnchor: 'middle' },
            }}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            domain={[0, 200]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
            labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
            formatter={(value: number) => [`${value} chapters`, 'Length']}
          />
          <Bar
            dataKey="chapters"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ArcLengthChart
