import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts'
import { Link } from 'react-router-dom'
import { fetchInsightsRawData } from '../../services/analytics/insightsAnalytics'
import { ChartCard } from '../common/ChartCard'
import { RangeSlider } from '../common/RangeSlider'
import { STRAW_HAT_IDS } from '../../constants/characters'

interface CharPoint {
  id: string
  name: string
  sagas: number
  appearances: number
  isSHP: boolean
  /** Appearances per saga — higher = more concentrated */
  density: number
}

export function AppearanceConcentrationSection() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const [hideStrawHats, setHideStrawHats] = useState(true)
  const [minAppearances, setMinAppearances] = useState(10)

  // Compute max saga count from data for slider bounds
  const maxSagaCount = useMemo(() => {
    if (!raw) return 11
    let max = 0
    for (const c of raw.characters) {
      if (c.saga_list && c.saga_list.length > max) max = c.saga_list.length
    }
    return max || 11
  }, [raw])

  const [sagaRange, setSagaRange] = useState<[number, number]>([1, 100])

  // Clamp saga range to actual max when data loads
  const effectiveSagaRange: [number, number] = [
    sagaRange[0],
    Math.min(sagaRange[1], maxSagaCount),
  ]

  const points = useMemo<CharPoint[]>(() => {
    if (!raw) return []
    return raw.characters
      .filter(
        (c) =>
          c.saga_list &&
          c.saga_list.length > 0 &&
          c.appearance_count &&
          c.appearance_count >= minAppearances
      )
      .map((c) => ({
        id: c.id,
        name: c.name || 'Unknown',
        sagas: c.saga_list!.length,
        appearances: c.appearance_count!,
        isSHP: STRAW_HAT_IDS.has(c.id),
        density:
          Math.round((c.appearance_count! / c.saga_list!.length) * 10) / 10,
      }))
  }, [raw, minAppearances])

  const filtered = useMemo(
    () =>
      points.filter(
        (p) =>
          (!hideStrawHats || !p.isSHP) &&
          p.sagas >= effectiveSagaRange[0] &&
          p.sagas <= effectiveSagaRange[1]
      ),
    [points, hideStrawHats, effectiveSagaRange[0], effectiveSagaRange[1]]
  )

  // Find notable characters for annotation
  const notable = useMemo(() => {
    if (filtered.length === 0) return { concentrated: [], spread: [] }
    // Most concentrated: high appearances, few sagas (high density)
    const byDensity = [...filtered].sort((a, b) => b.density - a.density)
    // Most spread: many sagas
    const bySagas = [...filtered].sort((a, b) => b.sagas - a.sagas)
    return {
      concentrated: byDensity.slice(0, 5),
      spread: bySagas.slice(0, 5),
    }
  }, [filtered])

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
        title="Appearance Concentration"
        description="Each dot is a character. X = number of sagas they appear in, Y = total chapter appearances. Characters in the top-left are concentrated supporting characters — many appearances in few sagas."
        downloadFileName="appearance-concentration"
        chartId="appearance-concentration"
        embedPath="/embed/insights/appearance-concentration"
        filters={
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideStrawHats}
                onChange={(e) => setHideStrawHats(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Hide Straw Hat Pirates
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span>Min appearances</span>
              <select
                value={minAppearances}
                onChange={(e) =>
                  setMinAppearances(parseInt(e.target.value, 10))
                }
                className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[5, 10, 20, 50, 100].map((v) => (
                  <option key={v} value={v}>
                    {v}+
                  </option>
                ))}
              </select>
            </label>
            <span className="text-xs text-gray-400">
              {filtered.length} characters shown
            </span>
            <div className="w-full sm:w-64">
              <RangeSlider
                label="Sagas"
                min={1}
                max={maxSagaCount}
                value={effectiveSagaRange}
                onChange={setSagaRange}
              />
            </div>
          </div>
        }
      >
        <style>
          {`
            .recharts-scatter-symbol:focus { outline: none !important; }
            .recharts-scatter-symbol:focus-visible { outline: none !important; }
          `}
        </style>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              dataKey="sagas"
              name="Sagas"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              domain={[0, 'auto']}
              allowDecimals={false}
            >
              <Label
                value="Number of Sagas"
                position="insideBottom"
                offset={-10}
                style={{ fontSize: 12, fill: '#6b7280' }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="appearances"
              name="Appearances"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            >
              <Label
                value="Chapter Appearances"
                angle={-90}
                position="insideLeft"
                offset={5}
                style={{ fontSize: 12, fill: '#6b7280' }}
              />
            </YAxis>
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as CharPoint
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs">
                      <p className="font-semibold text-gray-900 mb-2">
                        {d.name}
                        {d.isSHP && (
                          <span className="ml-2 text-xs text-amber-600 font-medium">
                            SHP
                          </span>
                        )}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Appearances:</span>{' '}
                          <span className="text-emerald-600 font-semibold">
                            {d.appearances}
                          </span>{' '}
                          chapters
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Sagas:</span>{' '}
                          <span className="text-blue-600 font-semibold">
                            {d.sagas}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Density:</span>{' '}
                          <span className="text-purple-600 font-semibold">
                            {d.density}
                          </span>{' '}
                          appearances/saga
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Scatter
              data={filtered}
              fill="#8b5cf6"
              fillOpacity={0.5}
              stroke="#7c3aed"
              strokeWidth={1}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Notable characters tables */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Most Concentrated (high appearances/saga)
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              Supporting characters with many appearances in few sagas
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-900">
                    Character
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-900">
                    Ch.
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-900">
                    Sagas
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-900">
                    Ch./Saga
                  </th>
                </tr>
              </thead>
              <tbody>
                {notable.concentrated.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="py-1.5 px-2 font-medium">
                      <Link
                        to={`/characters/${c.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-1.5 px-2 text-right text-gray-700">
                      {c.appearances}
                    </td>
                    <td className="py-1.5 px-2 text-right text-gray-700">
                      {c.sagas}
                    </td>
                    <td className="py-1.5 px-2 text-right font-semibold text-purple-600">
                      {c.density}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Most Spread Out (many sagas)
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              Characters with appearances across the most sagas
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-900">
                    Character
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-900">
                    Ch.
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-900">
                    Sagas
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-900">
                    Ch./Saga
                  </th>
                </tr>
              </thead>
              <tbody>
                {notable.spread.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="py-1.5 px-2 font-medium">
                      <Link
                        to={`/characters/${c.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-1.5 px-2 text-right text-gray-700">
                      {c.appearances}
                    </td>
                    <td className="py-1.5 px-2 text-right text-gray-700">
                      {c.sagas}
                    </td>
                    <td className="py-1.5 px-2 text-right font-semibold text-purple-600">
                      {c.density}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ChartCard>
    </div>
  )
}
