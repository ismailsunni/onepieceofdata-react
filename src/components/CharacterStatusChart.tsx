import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieLabelRenderProps,
} from 'recharts'
import { StatusDistribution } from '../services/analyticsService'

interface CharacterStatusChartProps {
  data: StatusDistribution[]
}

const RADIAN = Math.PI / 180

const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
  
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    innerRadius === undefined ||
    outerRadius === undefined ||
    percent === undefined
  ) {
    return null
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={14}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function CharacterStatusChart({ data }: CharacterStatusChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Character Status Distribution
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Breakdown of character statuses in the series
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="count"
            nameKey="status"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
            formatter={(value: number, name: string) => [
              `${value} characters`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => {
              const item = data.find(d => d.status === value)
              return `${value} (${item?.count || 0})`
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CharacterStatusChart
