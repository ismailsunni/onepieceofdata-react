import { useState } from 'react'
import { RankingTable } from './RankingTable'
import { EmbedFooter } from './EmbedFooter'
import type {
  SagaTopCharacters,
  ArcTopCharacters,
} from '../../services/analytics/insightsAnalytics'

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
