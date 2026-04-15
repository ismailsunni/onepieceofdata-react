import { useMemo, memo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { Character } from '../types/character'
import { ChartCard } from './common/ChartCard'
import { supabase } from '../services/supabase'
import { fetchDatabaseStats } from '../services/statsService'
import type { Saga } from '../types/arc'

interface CoverTimelineChartProps {
  characters: Character[]
}

interface SagaVolumeRange extends Saga {
  startVolume: number
  endVolume: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      character: string
      volume: number
      characterIndex: number
    }
  }>
}

interface AxisTickProps {
  x?: number
  y?: number
  payload?: {
    value: number
  }
}

const SAGA_COLORS = [
  '#EFF6FF', // blue-50
  '#FFF7ED', // orange-50
  '#F0FDF4', // green-50
  '#FDF2F8', // pink-50
  '#F5F3FF', // violet-50
  '#ECFDF5', // emerald-50
  '#FEF3C7', // amber-100
  '#E0F2FE', // sky-100
  '#FCE7F3', // pink-100
  '#EDE9FE', // violet-100
  '#DBEAFE', // blue-100
  '#FFEDD5', // orange-100
]

const COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
  '#06B6D4', // cyan
  '#F43F5E', // rose
  '#A855F7', // violet
  '#22D3EE', // sky
  '#FB923C', // orange-400
]

async function fetchSagasForChart(): Promise<Saga[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('saga')
    .select('*')
    .order('start_chapter', { ascending: true })
  if (error) return []
  return data || []
}

async function fetchChapterVolumeMapping(): Promise<
  Array<{ number: number; volume: number }>
> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('chapter')
    .select('number, volume')
  if (error) return []
  return (data || []).filter(
    (ch) => ch.volume !== null && ch.volume !== undefined
  )
}

function computeSagaVolumeRanges(
  sagas: Saga[],
  chapters: Array<{ number: number; volume: number }>
): SagaVolumeRange[] {
  return sagas
    .map((saga) => {
      let minVol = Infinity
      let maxVol = -Infinity
      for (const ch of chapters) {
        if (ch.number >= saga.start_chapter && ch.number <= saga.end_chapter) {
          if (ch.volume < minVol) minVol = ch.volume
          if (ch.volume > maxVol) maxVol = ch.volume
        }
      }
      return { ...saga, startVolume: minVol, endVolume: maxVol }
    })
    .filter((s) => s.startVolume !== Infinity)
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-gray-800">{data.character}</p>
        <p className="text-sm text-gray-600">Volume: {data.volume}</p>
      </div>
    )
  }
  return null
}

const CustomYAxisTick = (characterNames: string[]) => {
  return ({ x, y, payload }: AxisTickProps) => {
    if (!payload) return null
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="#666"
          fontSize={12}
          className="truncate"
        >
          {characterNames[payload.value]}
        </text>
      </g>
    )
  }
}

const CoverTimelineChart = memo(({ characters }: CoverTimelineChartProps) => {
  const { data: sagas = [] } = useQuery({
    queryKey: ['saga-timeline-chart'],
    queryFn: fetchSagasForChart,
  })

  const { data: chapterVolumes = [] } = useQuery({
    queryKey: ['chapter-volume-mapping'],
    queryFn: fetchChapterVolumeMapping,
    staleTime: 10 * 60 * 1000,
  })

  // Use the absolute total volume count as the x-axis max so the timeline
  // always extends to the latest published volume.
  const { data: dbStats } = useQuery({
    queryKey: ['database-stats'],
    queryFn: fetchDatabaseStats,
    staleTime: 10 * 60 * 1000,
  })

  const sagaVolumeRanges = useMemo(
    () => computeSagaVolumeRanges(sagas, chapterVolumes),
    [sagas, chapterVolumes]
  )

  const chartData = useMemo(() => {
    const data: Array<{
      character: string
      volume: number
      characterIndex: number
    }> = []

    characters.forEach((character, index) => {
      if (character.name && character.cover_volume_list) {
        character.cover_volume_list.forEach((volume) => {
          data.push({
            character: character.name as string,
            volume,
            characterIndex: index,
          })
        })
      }
    })

    return data
  }, [characters])

  const characterNames = useMemo(() => {
    return characters
      .filter((char) => char.name)
      .map((char) => char.name as string)
  }, [characters])

  // X-axis max comes from the total volume count (latest published volume).
  // Falls back to derived max from selected characters if stats not yet loaded.
  const volumeMax = useMemo(() => {
    if (dbStats?.volumes && dbStats.volumes > 0) return dbStats.volumes
    let max = -Infinity
    characters.forEach((character) => {
      if (
        character.cover_volume_list &&
        character.cover_volume_list.length > 0
      ) {
        const charMax = Math.max(...character.cover_volume_list)
        if (charMax > max) max = charMax
      }
    })
    return max === -Infinity ? 110 : max
  }, [dbStats?.volumes, characters])

  const yAxisTick = useMemo(
    () => CustomYAxisTick(characterNames),
    [characterNames]
  )

  const hasData = chartData.length > 0

  return (
    <ChartCard
      title="Volume Cover Appearance Timeline"
      downloadFileName="cover-timeline"
      chartId="cover-timeline"
      className="w-full"
    >
      {hasData ? (
        <>
          <ResponsiveContainer
            width="100%"
            height={Math.max(400, characters.length * 50)}
          >
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 60,
                left: 120,
              }}
            >
              {/* Saga background bands (mapped to volume ranges) */}
              {sagaVolumeRanges.map((saga, i) => (
                <ReferenceArea
                  key={saga.saga_id}
                  x1={saga.startVolume}
                  x2={saga.endVolume}
                  y1={0}
                  y2={characters.length - 1}
                  fill={SAGA_COLORS[i % SAGA_COLORS.length]}
                  fillOpacity={1}
                  stroke="none"
                  ifOverflow="hidden"
                />
              ))}
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="volume"
                name="Volume"
                domain={[0, volumeMax]}
                label={{
                  value: 'Volume Number',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 14, fontWeight: 'bold' },
                }}
              />
              <YAxis
                type="number"
                dataKey="characterIndex"
                name="Character"
                domain={[0, characters.length - 1]}
                tick={yAxisTick}
                ticks={characters.map((_, index) => index)}
              />
              <Tooltip content={<CustomTooltip />} />

              {characters.map((character, index) => {
                const characterData = chartData.filter(
                  (d) => d.character === character.name
                )
                return (
                  <Scatter
                    key={character.id}
                    name={character.name || `Character ${index}`}
                    data={characterData}
                    fill={COLORS[index % COLORS.length]}
                    shape="circle"
                    isAnimationActive={false}
                  />
                )
              })}
            </ScatterChart>
          </ResponsiveContainer>

          {/* Saga Legend */}
          {sagaVolumeRanges.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
              <span className="font-medium text-gray-500">Sagas:</span>
              {sagaVolumeRanges.map((saga, i) => (
                <span
                  key={saga.saga_id}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className="w-4 h-3 rounded border border-gray-200 shrink-0"
                    style={{
                      backgroundColor: SAGA_COLORS[i % SAGA_COLORS.length],
                    }}
                  />
                  <span className="whitespace-nowrap">
                    {saga.title}
                    <span className="text-gray-400 ml-1">
                      (Vol. {saga.startVolume}–{saga.endVolume})
                    </span>
                  </span>
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500 py-8">
          No volume cover data available for the selected characters.
        </p>
      )}
    </ChartCard>
  )
})

CoverTimelineChart.displayName = 'CoverTimelineChart'

export default CoverTimelineChart
