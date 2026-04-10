import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchInsightsRawData,
  computeTopCharactersPerSaga,
  computeTopCharactersPerArc,
} from '../services/analyticsService'
import { STRAW_HAT_IDS } from '../constants/characters'

function EmbedInsightPage() {
  const { chartId } = useParams<{ chartId: string }>()

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const insights = useMemo(() => {
    if (!raw) return null
    const { characters, arcs, sagas } = raw
    return {
      topCharactersPerSaga: computeTopCharactersPerSaga(characters, sagas, 31),
      topCharactersPerArc: computeTopCharactersPerArc(characters, arcs, 31),
    }
  }, [raw])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!insights) return null

  if (chartId === 'top-characters-per-saga') {
    return <EmbedTopCharactersPerSaga data={insights.topCharactersPerSaga} />
  }

  if (chartId === 'top-characters-per-arc') {
    return <EmbedTopCharactersPerArc data={insights.topCharactersPerArc} />
  }

  return (
    <div className="p-8 text-center text-gray-500">
      Chart not found: {chartId}
    </div>
  )
}

function EmbedTopCharactersPerSaga({
  data,
}: {
  data: ReturnType<typeof computeTopCharactersPerSaga>
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

function EmbedTopCharactersPerArc({
  data,
}: {
  data: ReturnType<typeof computeTopCharactersPerArc>
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

interface RankingItem {
  id: string
  title: string
  totalChapters: number
  characters: { id: string; name: string; count: number }[]
}

function RankingTable({
  items,
  linkPrefix,
  shpFilter,
  showPct,
}: {
  items: RankingItem[]
  linkPrefix: string
  shpFilter: 'all' | 'hide' | 'only'
  showPct: boolean
}) {
  const displayRows = 20
  const filtered = items.map((item) => ({
    ...item,
    characters: (shpFilter === 'hide'
      ? item.characters.filter((c) => !STRAW_HAT_IDS.has(c.id))
      : shpFilter === 'only'
        ? item.characters.filter((c) => STRAW_HAT_IDS.has(c.id))
        : item.characters
    ).slice(0, displayRows),
  }))

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[40px] border-r border-gray-200">
              #
            </th>
            {filtered.map((item) => (
              <th
                key={item.id}
                className="bg-gray-50 px-2 py-2 text-center font-medium text-gray-600 min-w-[140px]"
              >
                <Link
                  to={`${linkPrefix}${item.id}`}
                  target="_blank"
                  className="hover:text-blue-600 transition-colors text-xs"
                >
                  <div>{item.title}</div>
                  <div className="text-[10px] text-gray-400 font-normal">
                    {item.totalChapters} chapters
                  </div>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: displayRows }, (_, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-gray-100 ${rowIdx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
            >
              <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-center font-medium text-gray-400 border-r border-gray-200 tabular-nums">
                {rowIdx + 1}
              </td>
              {filtered.map((item) => {
                const char = item.characters[rowIdx]
                if (!char) {
                  return (
                    <td
                      key={item.id}
                      className="px-2 py-1.5 text-center text-gray-300"
                    >
                      &ndash;
                    </td>
                  )
                }
                const isSHP = STRAW_HAT_IDS.has(char.id)
                const pct =
                  Math.round((char.count / item.totalChapters) * 1000) / 10
                const isOver50 = pct > 50
                return (
                  <td
                    key={item.id}
                    className={`px-2 py-1.5 text-xs ${isSHP ? 'bg-amber-50' : ''}`}
                  >
                    <Link
                      to={`/characters/${char.id}`}
                      target="_blank"
                      className={`hover:text-blue-600 transition-colors ${isSHP ? 'font-medium text-amber-700' : ''} ${isOver50 ? 'font-bold' : ''}`}
                    >
                      {char.name}
                    </Link>
                    <span
                      className={`ml-1 tabular-nums ${isOver50 ? 'font-bold text-gray-600' : 'text-gray-400'}`}
                    >
                      ({showPct ? `${pct}%` : char.count})
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmbedFooter() {
  const baseUrl = window.location.origin + window.location.pathname
  return (
    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
      <span>One Piece of Data</span>
      <a
        href={`${baseUrl}#/analytics/insights`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-blue-500 transition-colors"
      >
        View full insights &rarr;
      </a>
    </div>
  )
}

export default EmbedInsightPage
