import { useState } from 'react'
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
import { TopBounty } from '../services/analyticsService'
import { ChartCard } from './common/ChartCard'

interface TopBountiesChartProps {
  dataAll: TopBounty[]
  dataAlive: TopBounty[]
}

// Generate gradient colors from red (highest) to orange (lowest)
const generateGradientColors = (count: number): string[] => {
  const colors = []
  for (let i = 0; i < count; i++) {
    // Interpolate between red (#dc2626) and orange (#f59e0b)
    const ratio = i / (count - 1)
    colors.push(
      ratio < 0.33
        ? '#dc2626' // Red for top 3
        : ratio < 0.66
          ? '#ea580c' // Orange-red for middle
          : '#f59e0b' // Orange for rest
    )
  }
  return colors
}

function TopBountiesChart({ dataAll, dataAlive }: TopBountiesChartProps) {
  const [showAliveOnly, setShowAliveOnly] = useState(false)
  const data = showAliveOnly ? dataAlive : dataAll
  const colors = generateGradientColors(data.length)

  // Format bounty for display
  const formatBounty = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`
    }
    return value.toLocaleString()
  }

  return (
    <ChartCard
      title="Top 10 Highest Bounties"
      downloadFileName="top-bounties"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-600">
            Characters with the highest bounties (in Berries)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <button
            onClick={() => setShowAliveOnly(false)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${!showAliveOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setShowAliveOnly(true)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${showAliveOnly
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Alive Only
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={formatBounty}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={110}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
            formatter={(value: number) => [
              `฿${value.toLocaleString()}`,
              'Bounty',
            ]}
            labelFormatter={(label: string) => {
              const character = data.find(d => d.name === label)
              return character?.origin
                ? `${label} (${character.origin})`
                : label
            }}
          />
          <Bar dataKey="bounty" radius={[0, 8, 8, 0]}>
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default TopBountiesChart
