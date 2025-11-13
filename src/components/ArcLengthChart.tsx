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
  // Group arcs by saga
  const sagaMap = new Map<string, { title: string; arcs: Arc[] }>()

  arcs.forEach((arc) => {
    const sagaTitle = arc.saga?.title || 'Unknown Saga'
    if (!sagaMap.has(sagaTitle)) {
      sagaMap.set(sagaTitle, { title: sagaTitle, arcs: [] })
    }
    sagaMap.get(sagaTitle)!.arcs.push(arc)
  })

  // Transform data for stacked bar chart
  const chartData: Record<string, string | number>[] = []
  const arcNames = new Set<string>()

  sagaMap.forEach((saga) => {
    const dataPoint: Record<string, string | number> = {
      saga: saga.title,
    }

    saga.arcs.forEach((arc) => {
      const chapters = arc.end_chapter - arc.start_chapter + 1
      dataPoint[arc.title] = chapters
      arcNames.add(arc.title)
    })

    chartData.push(dataPoint)
  })

  // Generate a better color palette (using a more harmonious scheme)
  const colors = [
    '#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed',
    '#db2777', '#0891b2', '#ea580c', '#4f46e5', '#65a30d',
    '#0284c7', '#e11d48', '#16a34a', '#ca8a04', '#9333ea',
    '#c026d3', '#0369a1', '#f97316', '#6366f1', '#84cc16',
    '#0e7490', '#be123c', '#15803d', '#a16207', '#7e22ce',
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Arc Length by Saga (Stacked by Arc)
      </h3>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="saga"
            angle={-45}
            textAnchor="end"
            height={100}
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
              maxHeight: '300px',
              overflow: 'auto',
            }}
            labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}
            formatter={(value: number, name: string) => [`${value} chapters`, name]}
          />
          {Array.from(arcNames).map((arcName, index) => (
            <Bar
              key={arcName}
              dataKey={arcName}
              stackId="saga"
              fill={colors[index % colors.length]}
              radius={index === arcNames.size - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ArcLengthChart
