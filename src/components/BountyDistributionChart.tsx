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
import { BountyRange } from '../services/analyticsService'

interface BountyDistributionChartProps {
  dataAll: BountyRange[]
  dataAlive: BountyRange[]
}

function BountyDistributionChart({ dataAll, dataAlive }: BountyDistributionChartProps) {
  const [showAliveOnly, setShowAliveOnly] = useState(false)
  const data = showAliveOnly ? dataAlive : dataAll

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Bounty Distribution
          </h3>
          <p className="text-sm text-gray-600">
            Number of characters in each bounty range (Berries)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <button
            onClick={() => setShowAliveOnly(false)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              !showAliveOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setShowAliveOnly(true)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              showAliveOnly
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alive Only
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="range"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{
              value: 'Bounty Range',
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
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BountyDistributionChart
