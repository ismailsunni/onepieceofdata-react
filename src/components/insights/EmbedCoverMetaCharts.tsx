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
  ScatterChart,
  Scatter,
} from 'recharts'
import { EmbedFooter } from './EmbedFooter'
import { fetchCharacters } from '../../services/characterService'
import { STRAW_HAT_IDS } from '../../constants/characters'
import type {
  CoverStar,
  CoverVsMain,
} from '../../services/analytics/insightsAnalytics'

// ── #17 Cover Stars ─────────────────────────────────────────────────────────

export function EmbedCoverStars({ data }: { data: CoverStar[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Top Volume Cover Stars
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6b7280" />
          <YAxis
            dataKey="name"
            type="category"
            width={110}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
          />
          <Tooltip />
          <Bar
            dataKey="coverAppearances"
            fill="#f59e0b"
            name="Cover Appearances"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── #18 Cover vs Main ───────────────────────────────────────────────────────

export function EmbedCoverVsMain({ data }: { data: CoverVsMain[] }) {
  return (
    <div className="p-4 font-sans">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Volume Cover vs Main Story Appearances
      </h2>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="main"
            name="Main Story Appearances"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <YAxis
            type="number"
            dataKey="cover"
            name="Volume Cover Appearances"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <Tooltip
            labelFormatter={(
              _: unknown,
              payload: ReadonlyArray<{ payload?: { name?: string } }>
            ) => payload?.[0]?.payload?.name || ''}
          />
          <Scatter data={data} fill="#8b5cf6" fillOpacity={0.5} />
        </ScatterChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}

// ── Cover Appearances per Volume ───────────────────────────────────────────

interface VolumeCoverData {
  volume: number
  shp: number
  nonShp: number
  total: number
}

function EmbedLoading() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

export function EmbedCoverPerVolume() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['embed', 'cover-per-volume'],
    queryFn: fetchCharacters,
    staleTime: 10 * 60 * 1000,
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

  if (isLoading) return <EmbedLoading />

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Cover Appearances per Volume
        </h2>
        <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideStrawHats}
            onChange={(e) => setHideStrawHats(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Hide SHP
        </label>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={volumeData}
          margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="volume"
            tick={{ fontSize: 9, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as VolumeCoverData
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-gray-900 mb-1">
                      Volume {label}
                    </p>
                    {!hideStrawHats && (
                      <>
                        <p className="text-sm text-gray-700">
                          SHP: <span className="font-medium">{data.shp}</span>
                        </p>
                        <p className="text-sm text-gray-700">
                          Others:{' '}
                          <span className="font-medium">{data.nonShp}</span>
                        </p>
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
              if (value === 'shp') return 'Straw Hats'
              if (value === 'nonShp') return 'Others'
              return value
            }}
          />
          {!hideStrawHats && (
            <Bar dataKey="shp" stackId="a" fill="#f59e0b" name="shp" />
          )}
          <Bar dataKey="nonShp" stackId="a" fill="#8b5cf6" name="nonShp" />
        </BarChart>
      </ResponsiveContainer>
      <EmbedFooter />
    </div>
  )
}
