import { useMemo, useState } from 'react'
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
    .select('id, name, chapter_list, appearance_count')
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

function CharacterSagaMatrixPage() {
  const [hideStrawHats, setHideStrawHats] = useState(false)
  const [minAppearances, setMinAppearances] = useState(10)

  const { data: characters = [], isLoading: charsLoading } = useQuery({
    queryKey: ['saga-matrix', 'characters'],
    queryFn: fetchMatrixCharacters,
  })

  const { data: sagas = [], isLoading: sagasLoading } = useQuery({
    queryKey: ['saga-matrix', 'sagas'],
    queryFn: fetchSagas,
  })

  const matrixData = useMemo(() => {
    if (!characters.length || !sagas.length) return []

    let filtered = characters.filter(
      (c) => (c.appearance_count ?? 0) >= minAppearances
    )
    if (hideStrawHats) {
      filtered = filtered.filter((c) => !STRAW_HAT_IDS.has(c.id))
    }

    return filtered.map((char) => {
      const chapters = char.chapter_list ?? []
      const sagaCounts: Record<string, number> = {}
      for (const saga of sagas) {
        sagaCounts[saga.saga_id] = chapters.filter(
          (ch) => ch >= saga.start_chapter && ch <= saga.end_chapter
        ).length
      }
      return {
        id: char.id,
        name: char.name ?? char.id,
        total: char.appearance_count ?? 0,
        sagaCounts,
      }
    })
  }, [characters, sagas, hideStrawHats, minAppearances])

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

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="min-appearances">Min appearances:</label>
          <input
            id="min-appearances"
            type="number"
            min={1}
            max={1000}
            value={minAppearances}
            onChange={(e) =>
              setMinAppearances(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <span className="text-xs text-gray-400">
          {matrixData.length} characters shown
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500">
        <span>Legend:</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-5 h-4 rounded border border-gray-200" /> 0
        </span>
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
      </div>

      {/* Heatmap Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[160px] border-r border-gray-200">
                  Character
                </th>
                {sagas.map((saga) => (
                  <th
                    key={saga.saga_id}
                    className="bg-gray-50 px-1 py-2 text-center font-medium text-gray-600 min-w-[60px]"
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
                      title={saga.title}
                    >
                      {saga.title}
                    </div>
                  </th>
                ))}
                <th className="sticky right-0 z-20 bg-gray-50 px-3 py-2 text-center font-semibold text-gray-700 min-w-[60px] border-l border-gray-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, idx) => (
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
                    return (
                      <td
                        key={saga.saga_id}
                        className={`px-1 py-1.5 text-center text-xs tabular-nums ${getCellColor(count)}`}
                        title={`${row.name} in ${saga.title}: ${count} chapters`}
                      >
                        {count > 0 ? count : '\u2013'}
                      </td>
                    )
                  })}
                  <td className="sticky right-0 z-10 bg-white px-3 py-1.5 text-center font-semibold text-gray-900 border-l border-gray-200 tabular-nums">
                    {row.total}
                  </td>
                </tr>
              ))}
              {matrixData.length === 0 && (
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

export default CharacterSagaMatrixPage
