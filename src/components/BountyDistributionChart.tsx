import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BountyRange, BountyStats } from '../services/analyticsService'

interface BountyDistributionChartProps {
  data: BountyRange[]
  stats?: BountyStats
}

function BountyDistributionChart({ data, stats }: BountyDistributionChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Bounty Distribution by Power Tier
        </h3>
        <p className="text-sm text-gray-600">
          Characters grouped by bounty ranges representing power tiers
        </p>
        {stats && (
          <p className="text-sm text-gray-500 mt-2">
            {stats.charactersWithBounty.toLocaleString()} of{' '}
            {stats.totalCharacters.toLocaleString()} characters have a bounty
            ({stats.percentage}%)
          </p>
        )}
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 60, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="range"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            interval={0}
            label={{
              value: 'Bounty Range',
              position: 'insideBottom',
              offset: -20,
              style: { fontSize: 14, fill: '#6b7280' },
            }}
          />
          <YAxis
            label={{
              value: 'Number of\nCharacters',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 13, fill: '#6b7280', textAnchor: 'middle' },
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
            formatter={(value: number, name: string) => {
              const label = name === 'alive' ? 'Alive' : 'Deceased/Unknown'
              return [`${value} characters`, label]
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const powerTier = (payload[0].payload as BountyRange).powerTier
                return `${powerTier} (${label})`
              }
              return label
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => value === 'alive' ? 'Alive' : 'Deceased/Unknown'}
          />
          <Bar dataKey="alive" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="notAlive" stackId="a" fill="#ef4444" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BountyDistributionChart
