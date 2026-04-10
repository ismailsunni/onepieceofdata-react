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
import type { Saga } from '../types/arc'

interface CharacterTimelineChartProps {
  characters: Character[]
}

// Recharts tooltip props type
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      character: string
      chapter: number
      characterIndex: number
    }
  }>
}

// Recharts axis tick props type
interface AxisTickProps {
  x?: number
  y?: number
  payload?: {
    value: number
  }
}

// Light background colors for saga bands (alternating)
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

async function fetchSagasForChart(): Promise<Saga[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('saga')
    .select('*')
    .order('start_chapter', { ascending: true })
  if (error) return []
  return data || []
}

// Generate a consistent color for each character
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

// Custom tooltip component (must be defined outside to avoid recreating on each render)
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-gray-800">{data.character}</p>
        <p className="text-sm text-gray-600">Chapter: {data.chapter}</p>
      </div>
    )
  }
  return null
}

// Custom Y-axis tick component (must be defined outside to avoid recreating on each render)
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

const CharacterTimelineChart = memo(
  ({ characters }: CharacterTimelineChartProps) => {
    const { data: sagas = [] } = useQuery({
      queryKey: ['saga-timeline-chart'],
      queryFn: fetchSagasForChart,
    })

    // Transform character data into scatter plot format
    const chartData = useMemo(() => {
      const data: Array<{
        character: string
        chapter: number
        characterIndex: number
      }> = []

      characters.forEach((character, index) => {
        if (character.name && character.chapter_list) {
          // For performance, if a character has too many appearances, sample them
          const chapters = character.chapter_list
          const maxPoints = 500 // Maximum points per character

          if (chapters.length > maxPoints) {
            // Sample evenly across the range
            const step = Math.ceil(chapters.length / maxPoints)
            for (let i = 0; i < chapters.length; i += step) {
              data.push({
                character: character.name as string,
                chapter: chapters[i],
                characterIndex: index,
              })
            }
          } else {
            // Add all chapters if under the limit
            chapters.forEach((chapter) => {
              data.push({
                character: character.name as string,
                chapter,
                characterIndex: index,
              })
            })
          }
        }
      })

      return data
    }, [characters])

    // Get unique character names for the Y-axis
    const characterNames = useMemo(() => {
      return characters
        .filter((char) => char.name)
        .map((char) => char.name as string)
    }, [characters])

    // Calculate the range for X-axis
    const chapterRange = useMemo(() => {
      let min = Infinity
      let max = -Infinity

      characters.forEach((character) => {
        if (character.chapter_list && character.chapter_list.length > 0) {
          const charMin = Math.min(...character.chapter_list)
          const charMax = Math.max(...character.chapter_list)
          if (charMin < min) min = charMin
          if (charMax > max) max = charMax
        }
      })

      return {
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 1000 : max,
      }
    }, [characters])

    // Create the Y-axis tick renderer with character names
    const yAxisTick = useMemo(
      () => CustomYAxisTick(characterNames),
      [characterNames]
    )

    return (
      <ChartCard
        title="Character Appearance Timeline"
        downloadFileName="character-timeline"
        className="w-full"
      >
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
            {/* Saga background bands */}
            {sagas.map((saga, i) => (
              <ReferenceArea
                key={saga.saga_id}
                x1={saga.start_chapter}
                x2={saga.end_chapter}
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
              dataKey="chapter"
              name="Chapter"
              domain={[0, chapterRange.max + 10]}
              label={{
                value: 'Chapter Number',
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

            {/* Create a scatter series for each character */}
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
        {sagas.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            <span className="font-medium text-gray-500">Sagas:</span>
            {sagas.map((saga, i) => (
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
                    ({saga.start_chapter}–{saga.end_chapter})
                  </span>
                </span>
              </span>
            ))}
          </div>
        )}
      </ChartCard>
    )
  }
)

CharacterTimelineChart.displayName = 'CharacterTimelineChart'

export default CharacterTimelineChart
