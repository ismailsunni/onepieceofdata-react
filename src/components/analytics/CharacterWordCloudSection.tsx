import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchInsightsRawData } from '../../services/analyticsService'
import { STRAW_HAT_IDS } from '../../constants/characters'
import { Character } from '../../types/character'
import { ChartCard } from '../common/ChartCard'

export type WordCloudMetric = 'chapter' | 'cover' | 'arc' | 'saga'

export const WORD_CLOUD_METRIC_OPTIONS: {
  value: WordCloudMetric
  label: string
  defaultMin: number
  suffix: string
}[] = [
  { value: 'chapter', label: 'Chapter Count', defaultMin: 100, suffix: 'ch' },
  { value: 'cover', label: 'Volume Cover Count', defaultMin: 1, suffix: 'cv' },
  { value: 'arc', label: 'Arc Count', defaultMin: 1, suffix: 'arcs' },
  { value: 'saga', label: 'Saga Count', defaultMin: 1, suffix: 'sagas' },
]

export function getWordCloudMetricValue(
  c: Character,
  metric: WordCloudMetric
): number {
  switch (metric) {
    case 'chapter':
      return c.appearance_count ?? c.chapter_list?.length ?? 0
    case 'cover':
      return c.cover_appearance_count ?? c.cover_volume_list?.length ?? 0
    case 'arc':
      return c.arc_list?.length ?? 0
    case 'saga':
      return c.saga_list?.length ?? 0
  }
}

// Deterministic hash → shuffled order so the cloud feel is stable per id.
function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 0xffffffff
}

interface WordCloudItem {
  id: string
  name: string
  value: number
  isSHP: boolean
}

const MIN_FONT = 11
const MAX_FONT = 44

/** Compute sqrt-scaled font size for a value in [min, max]. */
export function wordCloudFontSize(
  value: number,
  min: number,
  max: number
): number {
  if (max <= min) return MIN_FONT
  const t = Math.sqrt(Math.max(0, (value - min) / (max - min)))
  return MIN_FONT + t * (MAX_FONT - MIN_FONT)
}

interface WordCloudProps {
  items: WordCloudItem[]
  minValue: number
  maxValue: number
  suffix: string
  linkCharacters?: boolean
  /** Constrain cloud height; scrolls when overflowing. */
  maxHeight?: string
}

export function CharacterWordCloud({
  items,
  minValue,
  maxValue,
  suffix,
  linkCharacters = true,
  maxHeight = '420px',
}: WordCloudProps) {
  if (items.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-sm">
        No characters match the current filter.
      </p>
    )
  }
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 px-2 py-3 leading-none overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/30"
      style={{ maxHeight }}
    >
      {items.map((item) => {
        const size = wordCloudFontSize(item.value, minValue, maxValue)
        const title = `${item.name} — ${item.value} ${suffix}`
        const className = `transition-opacity hover:opacity-70 ${
          item.isSHP
            ? 'text-amber-700 font-semibold'
            : 'text-blue-700 font-medium'
        }`
        const style = { fontSize: `${size}px`, lineHeight: 1.05 }
        if (linkCharacters) {
          return (
            <Link
              key={item.id}
              to={`/characters/${item.id}`}
              title={title}
              className={className}
              style={style}
            >
              {item.name}
            </Link>
          )
        }
        return (
          <span key={item.id} title={title} className={className} style={style}>
            {item.name}
          </span>
        )
      })}
    </div>
  )
}

type SHPFilter = 'all' | 'hide' | 'only'

export function CharacterWordCloudSection() {
  const [metric, setMetric] = useState<WordCloudMetric>('chapter')
  const [shpFilter, setSHPFilter] = useState<SHPFilter>('all')
  const [minInput, setMinInput] = useState<Record<WordCloudMetric, number>>({
    chapter: 100,
    cover: 1,
    arc: 1,
    saga: 1,
  })

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const metricOpt = WORD_CLOUD_METRIC_OPTIONS.find((o) => o.value === metric)!
  const minValue = minInput[metric]

  const { items, maxValue, totalWithAny } = useMemo(() => {
    if (!raw)
      return {
        items: [] as WordCloudItem[],
        maxValue: 0,
        totalWithAny: 0,
      }
    const scored = raw.characters
      .filter((c) => c.name)
      .map<WordCloudItem>((c) => ({
        id: c.id,
        name: c.name as string,
        value: getWordCloudMetricValue(c, metric),
        isSHP: STRAW_HAT_IDS.has(c.id),
      }))
      .filter((r) =>
        shpFilter === 'hide' ? !r.isSHP : shpFilter === 'only' ? r.isSHP : true
      )
    const withAny = scored.filter((r) => r.value > 0)
    const max = withAny.reduce((m, r) => (r.value > m ? r.value : m), 0)
    const filtered = scored
      .filter((r) => r.value >= minValue)
      .sort((a, b) => hashId(a.id) - hashId(b.id))
    return { items: filtered, maxValue: max, totalWithAny: withAny.length }
  }, [raw, metric, minValue, shpFilter])

  const handleMetricChange = (m: WordCloudMetric) => {
    setMetric(m)
  }

  const handleMinChange = (n: number) => {
    const clamped = Math.max(1, Math.min(n, Math.max(1, maxValue)))
    setMinInput((prev) => ({ ...prev, [metric]: clamped }))
  }

  return (
    <div className="mb-6">
      <ChartCard
        title="Character Word Cloud"
        description="Character names sized by chapter, volume cover, arc, or saga counts. Click a name to open the character."
        downloadFileName="character-word-cloud"
        chartId="character-word-cloud"
        embedPath="/embed/insights/character-word-cloud"
        loading={isLoading}
        filters={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Size by</span>
              <select
                value={metric}
                onChange={(e) =>
                  handleMetricChange(e.target.value as WordCloudMetric)
                }
                className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WORD_CLOUD_METRIC_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Min</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, maxValue)}
                value={minValue}
                onChange={(e) =>
                  handleMinChange(parseInt(e.target.value, 10) || 1)
                }
                className="w-20 px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
              />
            </label>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {(['all', 'hide', 'only'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSHPFilter(v)}
                  className={`px-3 py-1.5 transition-colors ${
                    shpFilter === v
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v === 'all' ? 'All' : v === 'hide' ? 'Hide SHP' : 'Only SHP'}
                </button>
              ))}
            </div>
            <span className="text-gray-500 text-xs">
              Max: <span className="tabular-nums">{maxValue}</span>
            </span>
            <span className="text-gray-500 text-xs">
              Showing{' '}
              <span className="tabular-nums font-medium text-gray-700">
                {items.length}
              </span>{' '}
              of <span className="tabular-nums">{totalWithAny}</span> characters
            </span>
          </div>
        }
      >
        <CharacterWordCloud
          items={items}
          minValue={minValue}
          maxValue={maxValue}
          suffix={metricOpt.suffix}
        />
      </ChartCard>
    </div>
  )
}
