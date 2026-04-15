import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchInsightsRawData,
  computeMainCharacterMoments,
  type MainCharacterMoment,
} from '../../services/analyticsService'
import { STRAW_HAT_IDS } from '../../constants/characters'
import { ChartCard } from '../common/ChartCard'
import SortableTable, { type Column } from '../common/SortableTable'

type SHPFilter = 'all' | 'hide' | 'only'

export function MainCharacterMomentsSection() {
  const [shpFilter, setSHPFilter] = useState<SHPFilter>('all')

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const moments = useMemo<MainCharacterMoment[]>(() => {
    if (!raw) return []
    return computeMainCharacterMoments(raw.characters, raw.arcs, raw.sagas)
  }, [raw])

  const filtered = useMemo(() => {
    if (shpFilter === 'hide')
      return moments.filter((m) => !STRAW_HAT_IDS.has(m.id))
    if (shpFilter === 'only')
      return moments.filter((m) => STRAW_HAT_IDS.has(m.id))
    return moments
  }, [moments, shpFilter])

  const columns: Column<MainCharacterMoment>[] = [
    {
      key: 'name',
      label: 'Character',
      sortValue: (row) => row.name,
      render: (row) => {
        const isSHP = STRAW_HAT_IDS.has(row.id)
        return (
          <Link
            to={`/characters/${row.id}`}
            className={`hover:underline font-medium ${
              isSHP ? 'text-amber-700' : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            {row.name}
          </Link>
        )
      },
    },
    {
      key: 'arcMainCount',
      label: 'Arc Moments',
      sortValue: (row) => row.arcMainCount,
      render: (row) => (
        <span
          className={`font-semibold tabular-nums ${
            row.arcMainCount > 0 ? 'text-purple-600' : 'text-gray-400'
          }`}
        >
          {row.arcMainCount}
        </span>
      ),
    },
    {
      key: 'sagaMainCount',
      label: 'Saga Moments',
      sortValue: (row) => row.sagaMainCount,
      render: (row) => (
        <span
          className={`font-semibold tabular-nums ${
            row.sagaMainCount > 0 ? 'text-emerald-600' : 'text-gray-400'
          }`}
        >
          {row.sagaMainCount}
        </span>
      ),
    },
    {
      key: 'topArcs',
      label: 'Top Arcs',
      sortValue: (row) => row.topArc?.pct ?? -1,
      render: (row) => {
        if (row.arcMoments.length === 0)
          return <span className="text-gray-300">&ndash;</span>
        return (
          <div className="flex flex-col gap-0.5">
            {row.arcMoments.slice(0, 3).map((arc) => (
              <div key={arc.id} className="flex items-baseline gap-1.5">
                <Link
                  to={`/arcs/${arc.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  {arc.title}
                </Link>
                <span className="text-xs text-gray-500 tabular-nums">
                  {arc.count}/{arc.total}
                </span>
              </div>
            ))}
            {row.arcMoments.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{row.arcMoments.length - 3} more
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'topSagas',
      label: 'Top Sagas',
      sortValue: (row) => row.topSaga?.pct ?? -1,
      render: (row) => {
        if (row.sagaMoments.length === 0)
          return <span className="text-gray-300">&ndash;</span>
        return (
          <div className="flex flex-col gap-0.5">
            {row.sagaMoments.slice(0, 3).map((saga) => (
              <div key={saga.id} className="flex items-baseline gap-1.5">
                <Link
                  to={`/sagas/${saga.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  {saga.title}
                </Link>
                <span className="text-xs text-gray-500 tabular-nums">
                  {saga.count}/{saga.total}
                </span>
              </div>
            ))}
            {row.sagaMoments.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{row.sagaMoments.length - 3} more
              </span>
            )}
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <ChartCard
        title="Main Character Moments"
        description="Characters who appear in at least 50% of an arc or saga's chapters — the cast carrying each stretch of the story"
        downloadFileName="main-character-moments"
        chartId="main-character-moments"
        embedPath="/embed/insights/main-character-moments"
        filters={
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
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
        }
      >
        {filtered.length > 0 ? (
          <SortableTable<MainCharacterMoment>
            columns={columns}
            data={filtered}
            defaultSortField="arcMainCount"
            defaultSortDirection="desc"
            rowKey={(row) => row.id}
            maxHeight="600px"
          />
        ) : (
          <p className="text-gray-500 text-center py-8">
            No main character moments to show.
          </p>
        )}
      </ChartCard>
    </div>
  )
}
