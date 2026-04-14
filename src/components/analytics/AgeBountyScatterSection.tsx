import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { fetchCharacters } from '../../services/characterService'
import { ChartCard } from '../common/ChartCard'
import { RangeSlider } from '../common/RangeSlider'
import { STRAW_HAT_IDS } from '../../constants/characters'

interface AgeBountyPoint {
  id: string
  name: string
  age: number
  bounty: number
  status: string
}

function formatBounty(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

export function AgeBountyScatterSection() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: 5 * 60 * 1000,
  })

  // Build scatter data: only characters with both age and bounty
  const allPoints = useMemo<AgeBountyPoint[]>(() => {
    return characters
      .filter(
        (c) =>
          c.age !== null &&
          c.age !== undefined &&
          c.age > 0 &&
          c.bounty !== null &&
          c.bounty !== undefined &&
          c.bounty > 0
      )
      .map((c) => ({
        id: c.id,
        name: c.name ?? 'Unknown',
        age: c.age as number,
        bounty: c.bounty as number,
        status: c.status ?? 'Unknown',
      }))
  }, [characters])

  // Compute data bounds
  const bounds = useMemo(() => {
    if (allPoints.length === 0)
      return { minAge: 0, maxAge: 100, minBounty: 0, maxBounty: 5_000_000_000 }
    const ages = allPoints.map((p) => p.age)
    const bounties = allPoints.map((p) => p.bounty)
    return {
      minAge: Math.min(...ages),
      maxAge: Math.max(...ages),
      minBounty: Math.min(...bounties),
      maxBounty: Math.max(...bounties),
    }
  }, [allPoints])

  const [ageRange, setAgeRange] = useState<[number, number]>([0, 0])
  const [bountyRange, setBountyRange] = useState<[number, number]>([0, 0])
  const [hideStrawHats, setHideStrawHats] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize ranges once data loads
  if (!initialized && allPoints.length > 0) {
    setAgeRange([bounds.minAge, bounds.maxAge])
    setBountyRange([bounds.minBounty, bounds.maxBounty])
    setInitialized(true)
  }

  // Filter points
  const filtered = useMemo(() => {
    return allPoints.filter(
      (p) =>
        p.age >= ageRange[0] &&
        p.age <= ageRange[1] &&
        p.bounty >= bountyRange[0] &&
        p.bounty <= bountyRange[1] &&
        (!hideStrawHats || !STRAW_HAT_IDS.has(p.id))
    )
  }, [allPoints, ageRange, bountyRange, hideStrawHats])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <ChartCard
        title="Age vs Bounty"
        description={`${filtered.length} characters with both age and bounty data`}
        downloadFileName="age-vs-bounty"
        chartId="age-vs-bounty"
        embedPath="/embed/insights/age-vs-bounty"
        filters={
          <div className="flex flex-col gap-3 w-full max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RangeSlider
                label="Age"
                min={bounds.minAge}
                max={bounds.maxAge}
                value={ageRange}
                onChange={setAgeRange}
              />
              <RangeSlider
                label={`Bounty (${formatBounty(bountyRange[0])} – ${formatBounty(bountyRange[1])})`}
                min={bounds.minBounty}
                max={bounds.maxBounty}
                value={bountyRange}
                onChange={setBountyRange}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideStrawHats}
                onChange={(e) => setHideStrawHats(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Hide Straw Hat Pirates
            </label>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="age"
              name="Age"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              domain={[ageRange[0], ageRange[1]]}
              label={{
                value: 'Age',
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: 11, fill: '#6b7280' },
              }}
            />
            <YAxis
              type="number"
              dataKey="bounty"
              name="Bounty"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              domain={[bountyRange[0], bountyRange[1]]}
              tickFormatter={formatBounty}
              width={60}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as AgeBountyPoint
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <p className="font-semibold text-gray-900 mb-2">
                        {d.name}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Age:</span>{' '}
                          <span className="text-blue-600 font-semibold">
                            {d.age}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Bounty:</span>{' '}
                          <span className="text-amber-600 font-semibold">
                            {d.bounty.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Status:</span>{' '}
                          <span
                            className={
                              d.status === 'Alive'
                                ? 'text-green-600'
                                : d.status === 'Deceased'
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                            }
                          >
                            {d.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Scatter data={filtered} isAnimationActive={false}>
              {filtered.map((point, i) => (
                <Cell
                  key={i}
                  fill={
                    point.status === 'Alive'
                      ? '#10b981'
                      : point.status === 'Deceased'
                        ? '#ef4444'
                        : '#9ca3af'
                  }
                  fillOpacity={0.6}
                  stroke={
                    point.status === 'Alive'
                      ? '#059669'
                      : point.status === 'Deceased'
                        ? '#dc2626'
                        : '#6b7280'
                  }
                  strokeWidth={1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-4 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>{' '}
            Alive
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>{' '}
            Deceased
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-400 inline-block"></span>{' '}
            Unknown
          </span>
        </div>
      </ChartCard>
    </div>
  )
}
