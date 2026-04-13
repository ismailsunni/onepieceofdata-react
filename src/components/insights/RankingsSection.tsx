import { Link } from 'react-router-dom'
import { ChartCard } from '../common/ChartCard'
import { STRAW_HAT_IDS } from '../../constants/characters'
import type {
  SagaTopCharacters,
  ArcTopCharacters,
} from '../../services/analytics/insightsAnalytics'

interface RankingsSectionProps {
  topCharactersPerSaga: SagaTopCharacters[]
  topCharactersPerArc: ArcTopCharacters[]
  shpFilterSaga: 'all' | 'hide' | 'only'
  setSHPFilterSaga: (v: 'all' | 'hide' | 'only') => void
  showPctPerSaga: boolean
  setShowPctPerSaga: (v: boolean) => void
  shpFilterArc: 'all' | 'hide' | 'only'
  setSHPFilterArc: (v: 'all' | 'hide' | 'only') => void
  showPctPerArc: boolean
  setShowPctPerArc: (v: boolean) => void
}

export function RankingsSection({
  topCharactersPerSaga,
  topCharactersPerArc,
  shpFilterSaga,
  setSHPFilterSaga,
  showPctPerSaga,
  setShowPctPerSaga,
  shpFilterArc,
  setSHPFilterArc,
  showPctPerArc,
  setShowPctPerArc,
}: RankingsSectionProps) {
  return (
    <>
      {/* Top Characters per Saga */}
      <div className="mb-6">
        <ChartCard
          title="Top Characters per Saga"
          description="Who are the main characters of each saga? Characters ranked by chapter appearances within each saga"
          downloadFileName="top-characters-per-saga"
          chartId="top-characters-per-saga"
          embedPath="/embed/insights/top-characters-per-saga"
          filters={
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => setSHPFilterSaga('all')}
                  className={`px-3 py-1.5 transition-colors ${shpFilterSaga === 'all' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setSHPFilterSaga('hide')}
                  className={`px-3 py-1.5 transition-colors ${shpFilterSaga === 'hide' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Hide SHP
                </button>
                <button
                  onClick={() => setSHPFilterSaga('only')}
                  className={`px-3 py-1.5 transition-colors ${shpFilterSaga === 'only' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Only SHP
                </button>
              </div>
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => setShowPctPerSaga(false)}
                  className={`px-3 py-1.5 transition-colors ${!showPctPerSaga ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Count
                </button>
                <button
                  onClick={() => setShowPctPerSaga(true)}
                  className={`px-3 py-1.5 transition-colors ${showPctPerSaga ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  %
                </button>
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[40px] border-r border-gray-200">
                    #
                  </th>
                  {topCharactersPerSaga.map((saga) => (
                    <th
                      key={saga.sagaId}
                      className="bg-gray-50 px-2 py-2 text-center font-medium text-gray-600 min-w-[140px]"
                    >
                      <Link
                        to={`/sagas/${saga.sagaId}`}
                        className="hover:text-blue-600 transition-colors text-xs"
                      >
                        <div>{saga.sagaTitle}</div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          {saga.totalChapters} chapters
                        </div>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const displayRows = 20
                  const filteredSagas = topCharactersPerSaga.map((saga) => ({
                    ...saga,
                    characters: (shpFilterSaga === 'hide'
                      ? saga.characters.filter((c) => !STRAW_HAT_IDS.has(c.id))
                      : shpFilterSaga === 'only'
                        ? saga.characters.filter((c) => STRAW_HAT_IDS.has(c.id))
                        : saga.characters
                    ).slice(0, displayRows),
                  }))
                  return Array.from({ length: displayRows }, (_, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${rowIdx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                    >
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-center font-medium text-gray-400 border-r border-gray-200 tabular-nums">
                        {rowIdx + 1}
                      </td>
                      {filteredSagas.map((saga) => {
                        const char = saga.characters[rowIdx]
                        if (!char) {
                          return (
                            <td
                              key={saga.sagaId}
                              className="px-2 py-1.5 text-center text-gray-300"
                            >
                              &ndash;
                            </td>
                          )
                        }
                        const isSHP = STRAW_HAT_IDS.has(char.id)
                        const pct =
                          Math.round((char.count / saga.totalChapters) * 1000) /
                          10
                        const isOver50 = pct > 50
                        return (
                          <td
                            key={saga.sagaId}
                            className={`px-2 py-1.5 text-xs ${isSHP ? 'bg-amber-50' : ''}`}
                            title={`${char.name}: ${char.count} / ${saga.totalChapters} chapters in ${saga.sagaTitle} (${pct}%)`}
                          >
                            <Link
                              to={`/characters/${char.id}`}
                              className={`hover:text-blue-600 transition-colors ${isSHP ? 'font-medium text-amber-700' : ''} ${isOver50 ? 'font-bold' : ''}`}
                            >
                              {char.name}
                            </Link>
                            <span
                              className={`ml-1 tabular-nums ${isOver50 ? 'font-bold text-gray-600' : 'text-gray-400'}`}
                            >
                              ({showPctPerSaga ? `${pct}%` : char.count})
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* #22 Top Characters per Arc */}
      <div className="mb-6">
        <ChartCard
          title="Top Characters per Arc"
          description="Who are the main characters of each arc? Characters ranked by chapter appearances within each arc"
          downloadFileName="top-characters-per-arc"
          chartId="top-characters-per-arc"
          embedPath="/embed/insights/top-characters-per-arc"
          filters={
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => setSHPFilterArc('all')}
                  className={`px-3 py-1.5 transition-colors ${shpFilterArc === 'all' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setSHPFilterArc('hide')}
                  className={`px-3 py-1.5 transition-colors ${shpFilterArc === 'hide' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Hide SHP
                </button>
                <button
                  onClick={() => setSHPFilterArc('only')}
                  className={`px-3 py-1.5 transition-colors ${shpFilterArc === 'only' ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Only SHP
                </button>
              </div>
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => setShowPctPerArc(false)}
                  className={`px-3 py-1.5 transition-colors ${!showPctPerArc ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Count
                </button>
                <button
                  onClick={() => setShowPctPerArc(true)}
                  className={`px-3 py-1.5 transition-colors ${showPctPerArc ? 'bg-blue-600 text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  %
                </button>
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[40px] border-r border-gray-200">
                    #
                  </th>
                  {topCharactersPerArc.map((arc) => (
                    <th
                      key={arc.arcId}
                      className="bg-gray-50 px-2 py-2 text-center font-medium text-gray-600 min-w-[140px]"
                    >
                      <Link
                        to={`/arcs/${arc.arcId}`}
                        className="hover:text-blue-600 transition-colors text-xs"
                      >
                        <div>{arc.arcTitle}</div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          {arc.totalChapters} chapters
                        </div>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const displayRows = 20
                  const filteredArcs = topCharactersPerArc.map((arc) => ({
                    ...arc,
                    characters: (shpFilterArc === 'hide'
                      ? arc.characters.filter((c) => !STRAW_HAT_IDS.has(c.id))
                      : shpFilterArc === 'only'
                        ? arc.characters.filter((c) => STRAW_HAT_IDS.has(c.id))
                        : arc.characters
                    ).slice(0, displayRows),
                  }))
                  return Array.from({ length: displayRows }, (_, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${rowIdx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                    >
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-center font-medium text-gray-400 border-r border-gray-200 tabular-nums">
                        {rowIdx + 1}
                      </td>
                      {filteredArcs.map((arc) => {
                        const char = arc.characters[rowIdx]
                        if (!char) {
                          return (
                            <td
                              key={arc.arcId}
                              className="px-2 py-1.5 text-center text-gray-300"
                            >
                              &ndash;
                            </td>
                          )
                        }
                        const isSHP = STRAW_HAT_IDS.has(char.id)
                        const pct =
                          Math.round((char.count / arc.totalChapters) * 1000) /
                          10
                        const isOver50 = pct > 50
                        return (
                          <td
                            key={arc.arcId}
                            className={`px-2 py-1.5 text-xs ${isSHP ? 'bg-amber-50' : ''}`}
                            title={`${char.name}: ${char.count} / ${arc.totalChapters} chapters in ${arc.arcTitle} (${pct}%)`}
                          >
                            <Link
                              to={`/characters/${char.id}`}
                              className={`hover:text-blue-600 transition-colors ${isSHP ? 'font-medium text-amber-700' : ''} ${isOver50 ? 'font-bold' : ''}`}
                            >
                              {char.name}
                            </Link>
                            <span
                              className={`ml-1 tabular-nums ${isOver50 ? 'font-bold text-gray-600' : 'text-gray-400'}`}
                            >
                              ({showPctPerArc ? `${pct}%` : char.count})
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </>
  )
}
