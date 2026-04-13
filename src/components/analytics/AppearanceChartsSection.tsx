import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { STRAW_HAT_IDS } from '../../constants/characters'
import { fetchTimeSkipDistribution } from '../../services/analyticsService'
import { fetchSagas } from '../../services/sagaService'
import { supabase } from '../../services/supabase'
import { logger } from '../../utils/logger'
import TimeSkipVennDiagram from '../TimeSkipVennDiagram'
import { StatCard, SectionHeader } from './index'
import { ChartCard } from '../common/ChartCard'
import { RangeSlider } from '../common/RangeSlider'
import { SectionTitle } from '../insights/SectionTitle'
import type { LoyalCharacter } from '../../services/analytics/insightsAnalytics'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface MatrixCharacter {
  id: string
  name: string | null
  chapter_list: number[] | null
  appearance_count: number | null
}

async function fetchMatrixCharacters(): Promise<MatrixCharacter[]> {
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

interface AppearanceChartsSectionProps {
  mostLoyal: LoyalCharacter[]
}

export function AppearanceChartsSection({
  mostLoyal,
}: AppearanceChartsSectionProps) {
  const { data: timeSkipData, isLoading: timeSkipLoading } = useQuery({
    queryKey: ['analytics', 'time-skip-distribution'],
    queryFn: fetchTimeSkipDistribution,
  })

  const { data: matrixCharacters = [], isLoading: matrixCharsLoading } =
    useQuery({
      queryKey: ['concentration', 'characters'],
      queryFn: fetchMatrixCharacters,
    })

  const { data: sagas = [], isLoading: sagasLoading } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
  })

  const isLoading = timeSkipLoading || matrixCharsLoading || sagasLoading

  const concentrationData = useMemo(() => {
    if (!matrixCharacters.length || !sagas.length) return []
    return matrixCharacters.map((char) => {
      const chapters = char.chapter_list ?? []
      let sagasAppeared = 0
      for (const saga of sagas) {
        const count = chapters.filter(
          (ch) => ch >= saga.start_chapter && ch <= saga.end_chapter
        ).length
        if (count > 0) sagasAppeared++
      }
      const total = char.appearance_count ?? 0
      const avgPerSaga = sagasAppeared > 0 ? total / sagasAppeared : 0
      return {
        id: char.id,
        name: char.name ?? char.id,
        total,
        sagasAppeared,
        avgPerSaga,
      }
    })
  }, [matrixCharacters, sagas])

  const overviewStats = useMemo(() => {
    if (!concentrationData.length) {
      return {
        totalTracked: 0,
        avgAppearances: '0',
        recurringCast: 0,
      }
    }
    const total = concentrationData.reduce((s, c) => s + c.total, 0)
    const recurring = concentrationData.filter((c) => c.sagasAppeared >= 5).length
    return {
      totalTracked: concentrationData.length,
      avgAppearances: (total / concentrationData.length).toFixed(1),
      recurringCast: recurring,
    }
  }, [concentrationData])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <>
      <SectionTitle title="Overview & Loyalty" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <StatCard
          label="Characters Tracked"
          value={overviewStats.totalTracked.toLocaleString()}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          color="blue"
          tooltip="Characters with at least one chapter appearance recorded"
        />
        <StatCard
          label="Avg Appearances"
          value={`${overviewStats.avgAppearances}`}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
          color="emerald"
          tooltip="Mean chapter appearances per tracked character"
        />
        <StatCard
          label="Recurring Cast (5+ sagas)"
          value={overviewStats.recurringCast}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          }
          color="purple"
          tooltip="Characters appearing in 5 or more sagas — the true supporting cast"
        />
      </div>

      {/* Time Skip Distribution */}
      {timeSkipData && timeSkipData.total > 0 && (
        <>
          <SectionHeader
            title="Time Skip Character Distribution"
            description="Character appearances before, after, and across the 2-year time skip"
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <div className="mb-8">
            <TimeSkipVennDiagram data={timeSkipData} />
          </div>
        </>
      )}

      {/* Most Loyal Characters */}
      {mostLoyal.length > 0 && (
        <div className="mb-8">
          <ChartCard
            title='Most "Loyal" Characters'
            description="Highest appearance density: appearances / (last chapter - first chapter). Who shows up in nearly every chapter of their active span?"
            downloadFileName="most-loyal"
            chartId="most-loyal"
            embedPath="/embed/insights/most-loyal"
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={mostLoyal}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                  label={{
                    value: 'Density (%)',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fontSize: 11, fill: '#6b7280' },
                  }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Density']}
                  labelFormatter={(label: string) => {
                    const c = mostLoyal.find((l) => l.name === label)
                    return c
                      ? `${label} — ${c.appearances} appearances over ${c.span} chapters`
                      : label
                  }}
                />
                <Bar dataKey="density" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Appearance Concentration */}
      {concentrationData.length > 0 && (
        <ConcentrationTable data={concentrationData} />
      )}
    </>
  )
}

function ConcentrationTable({
  data,
}: {
  data: Array<{
    id: string
    name: string
    total: number
    sagasAppeared: number
    avgPerSaga: number
  }>
}) {
  type SortField =
    | 'avgPerSaga'
    | 'sagaPerApp'
    | 'total'
    | 'sagasAppeared'
    | 'name'
  const [sortField, setSortField] = useState<SortField>('avgPerSaga')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [hideStrawHats, setHideStrawHats] = useState(false)

  const maxTotal = Math.max(...data.map((d) => d.total), 1)
  const maxSagas = Math.max(...data.map((d) => d.sagasAppeared), 1)

  const [sagaRange, setSagaRange] = useState<[number, number]>([2, 99])
  const [totalRange, setTotalRange] = useState<[number, number]>([10, 9999])

  const effectiveSagaRange: [number, number] = [
    sagaRange[0],
    Math.min(sagaRange[1], maxSagas),
  ]
  const effectiveTotalRange: [number, number] = [
    totalRange[0],
    Math.min(totalRange[1], maxTotal),
  ]

  const filtered = data.filter(
    (d) =>
      d.sagasAppeared >= effectiveSagaRange[0] &&
      d.sagasAppeared <= effectiveSagaRange[1] &&
      d.total >= effectiveTotalRange[0] &&
      d.total <= effectiveTotalRange[1] &&
      (!hideStrawHats || !STRAW_HAT_IDS.has(d.id))
  )

  const sorted = [...filtered].sort((a, b) => {
    let av: number | string, bv: number | string
    if (sortField === 'sagaPerApp') {
      av = a.sagasAppeared > 0 ? a.sagasAppeared / a.total : 0
      bv = b.sagasAppeared > 0 ? b.sagasAppeared / b.total : 0
    } else if (sortField === 'name') {
      av = a.name
      bv = b.name
    } else {
      av = a[sortField] ?? 0
      bv = b[sortField] ?? 0
    }
    if (typeof av === 'string' && typeof bv === 'string')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc'
      ? Number(av) - Number(bv)
      : Number(bv) - Number(av)
  })

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const arrow = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mt-6 mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Appearance Concentration
        </h2>
        <p className="text-sm text-gray-500">
          Avg/Saga = concentrated presence · Sagas/App = spread across sagas
          (supporting characters)
        </p>
      </div>

      <div className="flex flex-wrap gap-6 mb-4 p-3 bg-gray-50 rounded-lg items-center">
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideStrawHats}
            onChange={(e) => setHideStrawHats(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Hide Straw Hats
        </label>
        <div className="flex-1 min-w-[200px]">
          <RangeSlider
            label="Sagas"
            min={1}
            max={maxSagas}
            value={[sagaRange[0], Math.min(sagaRange[1], maxSagas)]}
            onChange={setSagaRange}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <RangeSlider
            label="Total appearances"
            min={1}
            max={maxTotal}
            value={[totalRange[0], Math.min(totalRange[1], maxTotal)]}
            onChange={setTotalRange}
          />
        </div>
      </div>

      <div
        className="overflow-x-auto"
        style={{ maxHeight: '500px', overflowY: 'auto' }}
      >
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th
                className="text-left px-3 py-2 font-semibold text-gray-700 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                onClick={() => toggleSort('name')}
              >
                Character{arrow('name')}
              </th>
              <th
                className="text-right px-3 py-2 font-semibold text-gray-700 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                onClick={() => toggleSort('total')}
              >
                Total App.{arrow('total')}
              </th>
              <th
                className="text-right px-3 py-2 font-semibold text-gray-700 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                onClick={() => toggleSort('sagasAppeared')}
              >
                Sagas{arrow('sagasAppeared')}
              </th>
              <th
                className="text-right px-3 py-2 font-semibold text-gray-700 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                onClick={() => toggleSort('avgPerSaga')}
              >
                Avg/Saga{arrow('avgPerSaga')}
              </th>
              <th
                className="text-right px-3 py-2 font-semibold text-gray-700 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100"
                onClick={() => toggleSort('sagaPerApp')}
              >
                Sagas/App{arrow('sagaPerApp')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const sagaPerApp =
                row.total > 0 ? row.sagasAppeared / row.total : 0
              return (
                <tr
                  key={row.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-3 py-2 border-b border-gray-100">
                    <Link
                      to={`/characters/${row.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="text-right px-3 py-2 border-b border-gray-100">
                    {row.total}
                  </td>
                  <td className="text-right px-3 py-2 border-b border-gray-100">
                    {row.sagasAppeared}
                  </td>
                  <td className="text-right px-3 py-2 border-b border-gray-100 font-semibold">
                    {row.avgPerSaga.toFixed(1)}
                  </td>
                  <td className="text-right px-3 py-2 border-b border-gray-100 font-semibold text-purple-700">
                    {sagaPerApp.toFixed(3)}
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No characters match the filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {sorted.length} characters shown
      </p>
    </div>
  )
}
