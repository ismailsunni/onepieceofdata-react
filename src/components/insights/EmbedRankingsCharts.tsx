import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RankingTable } from './RankingTable'
import { EmbedFooter } from './EmbedFooter'
import SortableTable, { type Column } from '../common/SortableTable'
import { STRAW_HAT_IDS } from '../../constants/characters'
import {
  fetchInsightsRawData,
  computeMainCharacterMoments,
  type SagaTopCharacters,
  type ArcTopCharacters,
  type MainCharacterMoment,
} from '../../services/analyticsService'

// ── #21 Top Characters per Saga ─────────────────────────────────────────────

export function EmbedTopCharactersPerSaga({
  data,
}: {
  data: SagaTopCharacters[]
}) {
  const [shpFilter, setSHPFilter] = useState<'all' | 'hide' | 'only'>('hide')
  const [showPct, setShowPct] = useState(false)

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Characters per Saga
        </h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {(['all', 'hide', 'only'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSHPFilter(v)}
                className={`px-2 py-1 transition-colors ${shpFilter === v ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {v === 'all' ? 'All' : v === 'hide' ? 'Hide SHP' : 'Only SHP'}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              onClick={() => setShowPct(false)}
              className={`px-2 py-1 transition-colors ${!showPct ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Count
            </button>
            <button
              onClick={() => setShowPct(true)}
              className={`px-2 py-1 transition-colors ${showPct ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              %
            </button>
          </div>
        </div>
      </div>
      <RankingTable
        items={data.map((s) => ({
          id: s.sagaId,
          title: s.sagaTitle,
          totalChapters: s.totalChapters,
          characters: s.characters,
        }))}
        linkPrefix="/sagas/"
        shpFilter={shpFilter}
        showPct={showPct}
      />
      <EmbedFooter />
    </div>
  )
}

// ── #22 Top Characters per Arc ──────────────────────────────────────────────

export function EmbedTopCharactersPerArc({
  data,
}: {
  data: ArcTopCharacters[]
}) {
  const [shpFilter, setSHPFilter] = useState<'all' | 'hide' | 'only'>('hide')
  const [showPct, setShowPct] = useState(false)

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Characters per Arc
        </h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {(['all', 'hide', 'only'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSHPFilter(v)}
                className={`px-2 py-1 transition-colors ${shpFilter === v ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {v === 'all' ? 'All' : v === 'hide' ? 'Hide SHP' : 'Only SHP'}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              onClick={() => setShowPct(false)}
              className={`px-2 py-1 transition-colors ${!showPct ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Count
            </button>
            <button
              onClick={() => setShowPct(true)}
              className={`px-2 py-1 transition-colors ${showPct ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              %
            </button>
          </div>
        </div>
      </div>
      <RankingTable
        items={data.map((a) => ({
          id: a.arcId,
          title: a.arcTitle,
          totalChapters: a.totalChapters,
          characters: a.characters,
        }))}
        linkPrefix="/arcs/"
        shpFilter={shpFilter}
        showPct={showPct}
      />
      <EmbedFooter />
    </div>
  )
}

// ── Main Character Moments ─────────────────────────────────────────────────

export function EmbedMainCharacterMoments() {
  const [shpFilter, setSHPFilter] = useState<'all' | 'hide' | 'only'>('all')

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
      label: 'Arcs',
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
      label: 'Sagas',
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
                  className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                >
                  {arc.title}
                </Link>
                <span className="text-[10px] text-gray-500 tabular-nums">
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
                  className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                >
                  {saga.title}
                </Link>
                <span className="text-[10px] text-gray-500 tabular-nums">
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
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Main Character Moments
        </h2>
        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(['all', 'hide', 'only'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSHPFilter(v)}
              className={`px-2 py-1 transition-colors ${
                shpFilter === v
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'all' ? 'All' : v === 'hide' ? 'Hide SHP' : 'Only SHP'}
            </button>
          ))}
        </div>
      </div>
      {filtered.length > 0 ? (
        <SortableTable<MainCharacterMoment>
          columns={columns}
          data={filtered}
          defaultSortField="arcMainCount"
          defaultSortDirection="desc"
          rowKey={(row) => row.id}
          maxHeight="500px"
        />
      ) : (
        <p className="text-gray-500 text-center py-8 text-sm">
          No main character moments to show.
        </p>
      )}
      <EmbedFooter />
    </div>
  )
}
