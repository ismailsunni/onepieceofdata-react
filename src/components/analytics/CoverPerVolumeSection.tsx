import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { fetchCharacters } from '../../services/characterService'
import { ChartCard } from '../common/ChartCard'
import { STRAW_HAT_IDS } from '../../constants/characters'

interface VolumeCoverData {
  volume: number
  shp: number
  nonShp: number
  total: number
}

export function CoverPerVolumeSection() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: 5 * 60 * 1000,
  })

  const [hideStrawHats, setHideStrawHats] = useState(false)

  const volumeData = useMemo<VolumeCoverData[]>(() => {
    const volumeMap = new Map<number, { shp: number; nonShp: number }>()

    characters.forEach((c) => {
      if (!c.cover_volume_list || c.cover_volume_list.length === 0) return
      const isSHP = STRAW_HAT_IDS.has(c.id)
      c.cover_volume_list.forEach((vol) => {
        const entry = volumeMap.get(vol) || { shp: 0, nonShp: 0 }
        if (isSHP) entry.shp++
        else entry.nonShp++
        volumeMap.set(vol, entry)
      })
    })

    return Array.from(volumeMap.entries())
      .map(([volume, counts]) => ({
        volume,
        shp: counts.shp,
        nonShp: counts.nonShp,
        total: counts.shp + counts.nonShp,
      }))
      .sort((a, b) => a.volume - b.volume)
  }, [characters])

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
        title="Cover Appearances per Volume"
        description={`Character count on each volume cover across ${volumeData.length} volumes`}
        downloadFileName="cover-per-volume"
        chartId="cover-per-volume"
        embedPath="/embed/insights/cover-per-volume"
        filters={
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideStrawHats}
              onChange={(e) => setHideStrawHats(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Hide Straw Hat Pirates
          </label>
        }
      >
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={volumeData}
            margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="volume"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
              label={{
                value: 'Volume Number',
                position: 'insideBottom',
                offset: -15,
                style: { fontSize: 12, fill: '#6b7280' },
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              label={{
                value: 'Characters on Cover',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: '#6b7280' },
              }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as VolumeCoverData
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-gray-900 mb-2">
                        Volume {label}
                      </p>
                      {!hideStrawHats && (
                        <>
                          <p className="text-sm text-gray-700">
                            <span className="inline-block w-3 h-3 bg-amber-500 rounded mr-2"></span>
                            Straw Hats:{' '}
                            <span className="font-medium">{data.shp}</span>
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="inline-block w-3 h-3 bg-violet-500 rounded mr-2"></span>
                            Others:{' '}
                            <span className="font-medium">{data.nonShp}</span>
                          </p>
                          <div className="border-t border-gray-200 my-1"></div>
                        </>
                      )}
                      <p className="text-sm text-gray-700">
                        Total:{' '}
                        <span className="font-medium">
                          {hideStrawHats ? data.nonShp : data.total}
                        </span>
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: 11 }}
              formatter={(value: string) => {
                if (value === 'shp') return 'Straw Hat Pirates'
                if (value === 'nonShp') return 'Other Characters'
                return value
              }}
            />
            {!hideStrawHats && (
              <Bar dataKey="shp" stackId="a" fill="#f59e0b" name="shp" />
            )}
            <Bar dataKey="nonShp" stackId="a" fill="#8b5cf6" name="nonShp" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
