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

import { ChartCard } from './common/ChartCard'

function BountyDistributionChart({
  data,
  stats,
}: BountyDistributionChartProps) {
  return (
    <ChartCard
      title="Bounty Distribution by Power Tier"
      downloadFileName="bounty-distribution"
      chartId="bounty-distribution"
      embedPath="/embed/insights/bounty-distribution"
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Characters grouped by bounty ranges representing power tiers
        </p>
        {stats && (
          <p className="text-sm text-gray-500 mt-2">
            {stats.charactersWithBounty.toLocaleString()} of{' '}
            {stats.totalCharacters.toLocaleString()} characters have a bounty (
            {stats.percentage}%)
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
            formatter={(value) =>
              value === 'alive' ? 'Alive' : 'Deceased/Unknown'
            }
          />
          <Bar
            dataKey="alive"
            stackId="a"
            fill="#10b981"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="notAlive"
            stackId="a"
            fill="#ef4444"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Power Tier Reference Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-900">
                Power Tier
              </th>
              <th className="text-left py-2 px-3 font-semibold text-gray-900">
                Bounty Range
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-900">
                Count
              </th>
              <th className="text-left py-2 px-3 font-semibold text-gray-900">
                Example Characters
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((tier, idx) => (
              <tr
                key={tier.range}
                className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50/50' : ''}`}
              >
                <td className="py-2 px-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="font-medium text-gray-900">
                      {tier.powerTier}
                    </span>
                  </span>
                </td>
                <td className="py-2 px-3 text-gray-600">{tier.range}</td>
                <td className="py-2 px-3 text-right font-medium text-gray-700">
                  {tier.count}
                </td>
                <td className="py-2 px-3 text-gray-600">
                  {tier.examples.length > 0
                    ? tier.examples.map((e) => e.name).join(', ')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  )
}

export default BountyDistributionChart
