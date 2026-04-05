import { useState } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { logger } from '../utils/logger'
import { SectionHeader } from '../components/analytics'
import type { Saga } from '../types/arc'

interface SagaMatrixCharacter {
  id: string
  name: string | null
  chapter_list: number[] | null
  appearance_count: number | null
  saga_list: string[] | null
}

const STRAW_HAT_IDS = new Set([
  'Monkey_D._Luffy',
  'Roronoa_Zoro',
  'Nami',
  'Usopp',
  'Sanji',
  'Tony_Tony_Chopper',
  'Nico_Robin',
  'Franky',
  'Brook',
  'Jinbe',
])

async function fetchMatrixCharacters(): Promise<SagaMatrixCharacter[]> {
  if (!supabase) {
    logger.error('Supabase client is not initialized')
    return []
  }
  const { data, error } = await supabase
    .from('character')
    .select('id, name, chapter_list, appearance_count, saga_list')
    .gt('appearance_count', 0)
    .order('appearance_count', { ascending: false })
  if (error) {
    logger.error('Error fetching matrix characters:', error)
    return []
  }
  return data || []
}

async function fetchSagas(): Promise<Saga[]> {
  if (!supabase) {
    logger.error('Supabase client is not initialized')
    return []
  }
  const { data, error } = await supabase
    .from('saga')
    .select('*')
    .order('start_chapter', { ascending: true })
  if (error) {
    logger.error('Error fetching sagas:', error)
    return []
  }
  return data || []
}

function getCellColor(count: number): string {
  if (count === 0) return ''
  if (count <= 5) return 'bg-blue-50 text-gray-700'
  if (count <= 20) return 'bg-blue-100 text-gray-800'
  if (count <= 50) return 'bg-blue-200 text-gray-900'
  if (count <= 100) return 'bg-blue-300 text-gray-900'
  return 'bg-blue-400 text-white'
}

function getCellColorPercent(pct: number): string {
  if (pct === 0) return ''
  if (pct <= 10) return 'bg-blue-50 text-gray-700'
  if (pct <= 30) return 'bg-blue-100 text-gray-800'
  if (pct <= 60) return 'bg-blue-200 text-gray-900'
  if (pct <= 80) return 'bg-blue-300 text-gray-900'
  return 'bg-blue-400 text-white'
}

function CharacterSagaMatrixPage() {
  const [hideStrawHats, setHideStrawHats] = useState(false)
  const [nameSearch, setNameSearch] = useState('')
  const [showPercentage, setShowPercentage] = useState(false)
  const [appearanceRange, setAppearanceRange] = useState<[number, number]>([
    10, 9999,
  ])
  const [sagaCountRange, setSagaCountRange] = useState<[number, number]>([
    2, 99,
  ])
  const [heatmapSort, setHeatmapSort] = useState<{
    field: string
    dir: 'asc' | 'desc'
  }>({ field: 'total', dir: 'desc' })

  const { data: characters = [], isLoading: charsLoading } = useQuery({
    queryKey: ['saga-matrix', 'characters'],
    queryFn: fetchMatrixCharacters,
  })

  const { data: sagas = [], isLoading: sagasLoading } = useQuery({
    queryKey: ['saga-matrix', 'sagas'],
    queryFn: fetchSagas,
  })

  const maxAppearance =
    characters.length > 0
      ? Math.max(...characters.map((c) => c.appearance_count ?? 0))
      : 100
  const maxSagaCount =
    characters.length > 0
      ? Math.max(...characters.map((c) => c.saga_list?.length ?? 0))
      : 11

  const sagaChapterTotals: Record<string, number> = {}
  for (const saga of sagas) {
    sagaChapterTotals[saga.saga_id] = saga.end_chapter - saga.start_chapter + 1
  }

  const matrixData = (() => {
    if (!characters.length || !sagas.length) return []

    let filtered = characters.filter(
      (c) =>
        (c.appearance_count ?? 0) >= appearanceRange[0] &&
        (c.appearance_count ?? 0) <=
          Math.min(appearanceRange[1], maxAppearance) &&
        (c.saga_list?.length ?? 0) >= sagaCountRange[0] &&
        (c.saga_list?.length ?? 0) <= Math.min(sagaCountRange[1], maxSagaCount)
    )
    if (hideStrawHats) {
      filtered = filtered.filter((c) => !STRAW_HAT_IDS.has(c.id))
    }
    if (nameSearch.trim()) {
      const q = nameSearch.trim().toLowerCase()
      filtered = filtered.filter((c) =>
        (c.name ?? c.id).toLowerCase().includes(q)
      )
    }

    return filtered.map((char) => {
      const chapters = char.chapter_list ?? []
      const sagaCounts: Record<string, number> = {}
      const sagaPercentages: Record<string, number> = {}
      for (const saga of sagas) {
        const count = chapters.filter(
          (ch) => ch >= saga.start_chapter && ch <= saga.end_chapter
        ).length
        sagaCounts[saga.saga_id] = count
        const total = sagaChapterTotals[saga.saga_id] ?? 1
        sagaPercentages[saga.saga_id] =
          count > 0 ? Math.round((count / total) * 1000) / 10 : 0
      }
      const sagasAppeared = Object.values(sagaCounts).filter(
        (v) => v > 0
      ).length
      const avgPerSaga =
        sagasAppeared > 0 ? (char.appearance_count ?? 0) / sagasAppeared : 0
      return {
        id: char.id,
        name: char.name ?? char.id,
        total: char.appearance_count ?? 0,
        sagaCounts,
        sagaPercentages,
        sagasAppeared,
        avgPerSaga,
      }
    })
  })()

  const sortedMatrixData = [...matrixData].sort((a, b) => {
    const { field, dir } = heatmapSort
    let av: number, bv: number
    if (field === 'total') {
      av = a.total
      bv = b.total
    } else if (field === 'name') {
      return dir === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    } else {
      av = a.sagaCounts[field] ?? 0
      bv = b.sagaCounts[field] ?? 0
    }
    return dir === 'asc' ? av - bv : bv - av
  })

  const toggleHeatmapSort = (field: string) => {
    setHeatmapSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'desc' }
    )
  }

  const heatmapArrow = (field: string) =>
    heatmapSort.field === field ? (heatmapSort.dir === 'asc' ? ' ▲' : ' ▼') : ''

  const isLoading = charsLoading || sagasLoading

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/analytics" className="hover:text-gray-900 transition-colors">
          Analytics
        </Link>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="text-gray-900 font-medium">
          Saga Appearance Matrix
        </span>
      </nav>
      <SectionHeader
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        }
        title="Character Appearance by Saga"
        description="Heatmap showing how many chapters each character appears in per saga"
      />

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 flex flex-wrap items-center gap-4 sm:gap-6">
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideStrawHats}
            onChange={(e) => setHideStrawHats(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Hide Straw Hat Pirates
        </label>

        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setShowPercentage(false)}
            className={`px-3 py-1.5 transition-colors ${!showPercentage ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Count
          </button>
          <button
            onClick={() => setShowPercentage(true)}
            className={`px-3 py-1.5 transition-colors ${showPercentage ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            % of Saga
          </button>
        </div>

        <input
          type="text"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          placeholder="Search character name…"
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors w-48"
        />

        <RangeSlider
          label="Total appearances"
          min={1}
          max={maxAppearance}
          value={[
            appearanceRange[0],
            Math.min(appearanceRange[1], maxAppearance),
          ]}
          onChange={setAppearanceRange}
        />
        <RangeSlider
          label="Sagas appeared in"
          min={1}
          max={maxSagaCount}
          value={[sagaCountRange[0], Math.min(sagaCountRange[1], maxSagaCount)]}
          onChange={setSagaCountRange}
        />

        <span className="text-xs text-gray-400">
          {sortedMatrixData.length} characters shown
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500">
        <span>Legend:</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-5 h-4 rounded border border-gray-200" /> 0
        </span>
        {showPercentage ? (
          <>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-50" /> 1–10%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-100" /> 11–30%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-200" /> 31–60%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-300" /> 61–80%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-400" /> 81–100%
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-50" /> 1-5
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-100" /> 6-20
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-200" /> 21-50
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-300" /> 51-100
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-5 h-4 rounded bg-blue-400" /> 100+
            </span>
          </>
        )}
      </div>

      {/* Heatmap Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[160px] border-r border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => toggleHeatmapSort('name')}
                >
                  Character{heatmapArrow('name')}
                </th>
                {sagas.map((saga) => (
                  <th
                    key={saga.saga_id}
                    className="bg-gray-50 px-1 py-2 text-center font-medium text-gray-600 min-w-[60px] cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => toggleHeatmapSort(saga.saga_id)}
                    title={`Sort by ${saga.title}`}
                  >
                    <div
                      className="writing-vertical whitespace-nowrap text-xs"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        maxHeight: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {saga.title}
                      {heatmapArrow(saga.saga_id)}
                    </div>
                  </th>
                ))}
                <th
                  className="sticky right-0 z-20 bg-gray-50 px-3 py-2 text-center font-semibold text-gray-700 min-w-[60px] border-l border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => toggleHeatmapSort('total')}
                >
                  Total{heatmapArrow('total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMatrixData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                >
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-gray-800 border-r border-gray-200 whitespace-nowrap">
                    <Link
                      to={`/characters/${row.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {row.name}
                    </Link>
                  </td>
                  {sagas.map((saga) => {
                    const count = row.sagaCounts[saga.saga_id] ?? 0
                    const pct = row.sagaPercentages[saga.saga_id] ?? 0
                    const sagaTotal = sagaChapterTotals[saga.saga_id] ?? 0
                    return (
                      <td
                        key={saga.saga_id}
                        className={`px-1 py-1.5 text-center text-xs tabular-nums ${showPercentage ? getCellColorPercent(pct) : getCellColor(count)}`}
                        title={`${row.name} in ${saga.title}: ${count} / ${sagaTotal} chapters (${pct}%)`}
                      >
                        {showPercentage
                          ? pct > 0
                            ? `${pct}%`
                            : '\u2013'
                          : count > 0
                            ? count
                            : '\u2013'}
                      </td>
                    )
                  })}
                  <td className="sticky right-0 z-10 bg-white px-3 py-1.5 text-center font-semibold text-gray-900 border-l border-gray-200 tabular-nums">
                    {row.total}
                  </td>
                </tr>
              ))}
              {sortedMatrixData.length === 0 && (
                <tr>
                  <td
                    colSpan={sagas.length + 2}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No characters match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs text-gray-400">
          {value[0]} – {value[1]}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        min={min}
        max={max}
        step={1}
        minStepsBetweenThumbs={0}
      >
        <Slider.Track className="bg-gray-200 relative grow rounded-full h-1.5">
          <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer" />
        <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer" />
      </Slider.Root>
    </div>
  )
}

export default CharacterSagaMatrixPage
