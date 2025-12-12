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

// Get color based on character status
const getStatusColor = (status: string | null): string => {
  if (status === 'Alive') {
    return '#10b981' // green-500
  }
  return '#ef4444' // red-500 for Deceased or Unknown
}

function TopBountiesChart({ dataAll, dataAlive }: TopBountiesChartProps) {
  const [showAliveOnly, setShowAliveOnly] = useState(false)
  const data = showAliveOnly ? dataAlive : dataAll

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
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-xs text-gray-600">Alive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-xs text-gray-600">Deceased/Unknown</span>
            </div>
          </div>
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
              const statusText = character?.status ? ` - ${character.status}` : ''
              return character?.origin
                ? `${label} (${character.origin})${statusText}`
                : `${label}${statusText}`
            }}
          />
          <Bar dataKey="bounty" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default TopBountiesChart
