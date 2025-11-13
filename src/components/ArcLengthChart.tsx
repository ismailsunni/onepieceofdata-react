import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'
import { Arc } from '../types/arc'

interface ArcLengthChartProps {
  arcs: Arc[]
}

interface ChartDataPoint {
  saga: string
  totalChapters: number
  [arcName: string]: number | string
}

interface PayloadItem {
  name?: string
  value?: number
  color?: string
  dataKey?: string
  payload?: ChartDataPoint
}

interface CustomTooltipProps {
  active?: boolean
  payload?: PayloadItem[]
  label?: string
}

// Custom tooltip component - must be outside to avoid recreation on each render
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const totalChapters = payload[0].payload?.totalChapters || 0
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
          padding: '12px',
          maxHeight: '300px',
          overflow: 'auto',
        }}
      >
        <p style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          {label}
        </p>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
          Total: {totalChapters} chapters
        </p>
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
          {payload.map((entry, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              <span style={{ color: entry.color }}>●</span>
              {' '}
              <span style={{ fontSize: '13px' }}>
                {entry.name}: {entry.value} chapters
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
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
      totalChapters: saga.arcs.reduce((sum, arc) => sum + (arc.end_chapter - arc.start_chapter + 1), 0),
    }

    saga.arcs.forEach((arc) => {
      const chapters = arc.end_chapter - arc.start_chapter + 1
      dataPoint[arc.title] = chapters
      arcNames.add(arc.title)
    })

    chartData.push(dataPoint)
  })

  // Find the index to split Paradise and New World
  // Summit War is the last saga in Paradise, Fish-Man Island is first in New World
  const splitIndex = chartData.findIndex((d) =>
    d.saga === 'Fish-Man Island' || d.saga === 'Fishman Island' || d.saga === 'Fish Man Island'
  )

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
          {/* Background for Paradise (first half) */}
          {splitIndex > 0 && (
            <ReferenceArea
              x1={chartData[0].saga}
              x2={chartData[splitIndex - 1].saga}
              fill="#dbeafe"
              fillOpacity={0.5}
              label={{
                value: 'Paradise',
                position: 'insideTop',
                fill: '#1e40af',
                fontSize: 14,
                fontWeight: 'bold',
                offset: 10,
              }}
            />
          )}
          {/* Background for New World (second half) */}
          {splitIndex > 0 && splitIndex < chartData.length && (
            <ReferenceArea
              x1={chartData[splitIndex].saga}
              x2={chartData[chartData.length - 1].saga}
              fill="#fef2f2"
              fillOpacity={0.5}
              label={{
                value: 'New World',
                position: 'insideTop',
                fill: '#dc2626',
                fontSize: 14,
                fontWeight: 'bold',
                offset: 10,
              }}
            />
          )}
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
          <Tooltip content={<CustomTooltip />} />
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
