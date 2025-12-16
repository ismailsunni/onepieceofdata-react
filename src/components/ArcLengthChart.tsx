import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Cell,
} from 'recharts'
import { Arc } from '../types/arc'
import { ChartCard } from './common/ChartCard'

interface ArcLengthChartProps {
  arcs: Arc[]
  showSeparateBars?: boolean // When true, show each arc as a separate bar instead of stacked
  allArcs?: Arc[] // All arcs for consistent color mapping across filtered views
}

interface ChartDataPoint {
  saga: string
  totalChapters: number
  era?: 'Paradise' | 'New World'
  arcOrder: Array<{ name: string; chapters: number; startChapter: number }>
  [arcName: string]: number | string | Array<{ name: string; chapters: number; startChapter: number }> | 'Paradise' | 'New World' | undefined
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
    const chartData = payload[0].payload as ChartDataPoint
    const arcOrder = chartData?.arcOrder || []

    // Sort arcs by their start chapter to show in chronological order
    const sortedArcs = [...arcOrder].sort((a, b) => a.startChapter - b.startChapter)

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
          {label} ({totalChapters})
        </p>
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
          {sortedArcs.map((arc, index) => {
            // Find the corresponding payload item to get the color
            const payloadItem = payload.find(p => p.name === arc.name)
            return (
              <div key={index} style={{ marginBottom: '4px' }}>
                <span style={{ color: payloadItem?.color || '#6b7280' }}>●</span>
                {' '}
                <span style={{ fontSize: '13px' }}>
                  {arc.name} ({arc.chapters})
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  return null
}

function ArcLengthChart({ arcs, showSeparateBars = false, allArcs }: ArcLengthChartProps) {
  // Define color palette at the top level so it's consistent across both views
  const colors = [
    '#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed',
    '#db2777', '#0891b2', '#ea580c', '#4f46e5', '#65a30d',
    '#0284c7', '#e11d48', '#16a34a', '#ca8a04', '#9333ea',
    '#c026d3', '#0369a1', '#f97316', '#6366f1', '#84cc16',
    '#0e7490', '#be123c', '#15803d', '#a16207', '#7e22ce',
  ]

  // First, build a consistent mapping of arc names to colors
  // Use allArcs if provided (for filtered views), otherwise use arcs
  // This ensures the same arc always has the same color in both views
  const arcsForColorMapping = allArcs || arcs
  const sortedArcs = [...arcsForColorMapping].sort((a, b) => a.start_chapter - b.start_chapter)
  const arcColorMap = new Map<string, string>()
  sortedArcs.forEach((arc, index) => {
    arcColorMap.set(arc.title, colors[index % colors.length])
  })

  // When showing separate bars, create one data point per arc
  if (showSeparateBars) {
    // Sort arcs chronologically for display
    const sortedFilteredArcs = [...arcs].sort((a, b) => a.start_chapter - b.start_chapter)

    const chartData: ChartDataPoint[] = sortedFilteredArcs.map((arc) => {
      const chapters = arc.end_chapter - arc.start_chapter + 1
      return {
        saga: arc.title, // Use arc title as the x-axis label
        totalChapters: chapters,
        arcOrder: [{
          name: arc.title,
          chapters: chapters,
          startChapter: arc.start_chapter,
        }],
        [arc.title]: chapters,
        color: arcColorMap.get(arc.title) || colors[0], // Store color for this arc
      }
    })

    return (
      <ChartCard
        title="Arc Lengths in Chapters"
        downloadFileName="arc-lengths"
      >
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="saga"
              angle={-45}
              textAnchor="end"
              height={120}
              interval={0}
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              label={{
                value: 'Arc',
                position: 'insideBottom',
                offset: -10,
                style: { fontSize: 14, fill: '#6b7280', textAnchor: 'middle' },
              }}
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalChapters"
              fill="#059669"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color as string} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    )
  }

  // Original stacked bar chart logic for showing all sagas
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
  const chartData: ChartDataPoint[] = []
  const arcNamesSet = new Set<string>()

  sagaMap.forEach((saga) => {
    const arcOrder: Array<{ name: string; chapters: number; startChapter: number }> = []
    const dataPoint: ChartDataPoint = {
      saga: saga.title,
      totalChapters: saga.arcs.reduce((sum, arc) => sum + (arc.end_chapter - arc.start_chapter + 1), 0),
      arcOrder: arcOrder,
    }

    saga.arcs.forEach((arc) => {
      const chapters = arc.end_chapter - arc.start_chapter + 1
      dataPoint[arc.title] = chapters
      arcNamesSet.add(arc.title)
      arcOrder.push({
        name: arc.title,
        chapters: chapters,
        startChapter: arc.start_chapter,
      })
    })

    chartData.push(dataPoint)
  })

  // Sort arc names by their chronological order (matching the color map)
  const arcNames = sortedArcs
    .map(arc => arc.title)
    .filter(title => arcNamesSet.has(title))

  // Find the index to split Paradise and New World
  // Summit War is the last saga in Paradise, Fish-Man Island is first in New World
  const splitIndex = chartData.findIndex((d) =>
    d.saga === 'Fish-Man Island' || d.saga === 'Fishman Island' || d.saga === 'Fish Man Island'
  )

  // Add era information to each data point
  chartData.forEach((dataPoint, index) => {
    if (splitIndex > 0) {
      dataPoint.era = index < splitIndex ? 'Paradise' : 'New World'
    }
  })

  // Calculate total chapters for Paradise and New World
  const paradiseChapters = splitIndex > 0
    ? chartData.slice(0, splitIndex).reduce((sum, d) => sum + d.totalChapters, 0)
    : 0
  const newWorldChapters = splitIndex > 0 && splitIndex < chartData.length
    ? chartData.slice(splitIndex).reduce((sum, d) => sum + d.totalChapters, 0)
    : 0

  return (
    <ChartCard
      title="Arc and Saga Lengths in Chapters"
      downloadFileName="arc-saga-lengths"
    >
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
                value: `Paradise (${paradiseChapters})`,
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
                value: `New World (${newWorldChapters})`,
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
            label={{
              value: 'Saga',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 14, fill: '#6b7280', textAnchor: 'middle' },
            }}
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
          {arcNames.map((arcName, index) => (
            <Bar
              key={arcName}
              dataKey={arcName}
              stackId="saga"
              fill={arcColorMap.get(arcName) || colors[index % colors.length]}
              radius={index === arcNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default ArcLengthChart
