import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { fetchInsightsRawData } from '../../services/analytics/insightsAnalytics'
import { ChartCard } from '../common/ChartCard'
import type { Character } from '../../types/character'

// ── Types ────────────────────────────────────────────────────────────────────

interface VolumeOverlap {
  volume: number
  /** % of cover characters that are among the top 10 most-appeared in the volume */
  pctInTop10: number
  coverCount: number
  inTop10: number
  /** Names of cover characters NOT in the top 10 */
  outsiders: string[]
  /** Names of cover characters IN the top 10 */
  insiders: string[]
}

// ── Computation ──────────────────────────────────────────────────────────────

function computeCoverOverlap(
  characters: Character[],
  chapters: { number: number; volume: number | null }[]
): VolumeOverlap[] {
  // volume → chapter range
  const volumeRange = new Map<number, { start: number; end: number }>()
  for (const ch of chapters) {
    if (ch.volume == null) continue
    const r = volumeRange.get(ch.volume)
    if (!r) {
      volumeRange.set(ch.volume, { start: ch.number, end: ch.number })
    } else {
      if (ch.number < r.start) r.start = ch.number
      if (ch.number > r.end) r.end = ch.number
    }
  }

  // volume → cover character ids
  const volumeCover = new Map<number, Set<string>>()
  for (const c of characters) {
    if (!c.cover_volume_list) continue
    for (const vol of c.cover_volume_list) {
      let s = volumeCover.get(vol)
      if (!s) {
        s = new Set()
        volumeCover.set(vol, s)
      }
      s.add(c.id)
    }
  }

  const nameOf = (id: string) =>
    characters.find((c) => c.id === id)?.name || 'Unknown'

  const results: VolumeOverlap[] = []

  for (const vol of [...volumeRange.keys()].sort((a, b) => a - b)) {
    const range = volumeRange.get(vol)!
    const coverIds = volumeCover.get(vol)
    if (!coverIds || coverIds.size === 0) continue

    // Sort all characters by appearances in this volume, take top 10
    const ranked: { id: string; apps: number }[] = []
    for (const c of characters) {
      if (!c.chapter_list) continue
      const apps = c.chapter_list.filter(
        (ch) => ch >= range.start && ch <= range.end
      ).length
      if (apps > 0) ranked.push({ id: c.id, apps })
    }
    ranked.sort((a, b) => b.apps - a.apps)

    // Top 10 with tie handling: include everyone tied with the 10th
    const cutoff = ranked.length >= 10 ? ranked[9].apps : 0
    const top10Ids = new Set(
      ranked.filter((r) => r.apps >= cutoff).map((r) => r.id)
    )

    const insiders: string[] = []
    const outsiders: string[] = []
    for (const cid of coverIds) {
      if (top10Ids.has(cid)) insiders.push(nameOf(cid))
      else outsiders.push(nameOf(cid))
    }

    results.push({
      volume: vol,
      pctInTop10:
        coverIds.size > 0
          ? Math.round((insiders.length / coverIds.size) * 100)
          : 0,
      coverCount: coverIds.size,
      inTop10: insiders.length,
      insiders,
      outsiders,
    })
  }

  return results
}

// ── Color helper ─────────────────────────────────────────────────────────────

function barColor(pct: number): string {
  if (pct === 100) return '#059669' // emerald-600
  if (pct >= 75) return '#10b981' // emerald-500
  if (pct >= 50) return '#fbbf24' // amber-400
  if (pct >= 25) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

// ── Component ────────────────────────────────────────────────────────────────

export function CoverRankSection() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const volumes = useMemo(() => {
    if (!raw) return []
    return computeCoverOverlap(raw.characters, raw.chapters)
  }, [raw])

  const LEGEND_BUCKETS = [
    { label: '100%', color: '#059669', min: 100, max: 100 },
    { label: '75–99%', color: '#10b981', min: 75, max: 99 },
    { label: '50–74%', color: '#fbbf24', min: 50, max: 74 },
    { label: '25–49%', color: '#f97316', min: 25, max: 49 },
    { label: '<25%', color: '#ef4444', min: 0, max: 24 },
  ]

  const bucketCounts = useMemo(() => {
    const total = volumes.length
    return LEGEND_BUCKETS.map((b) => {
      const count = volumes.filter(
        (v) => v.pctInTop10 >= b.min && v.pctInTop10 <= b.max
      ).length
      return {
        ...b,
        count,
        pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }
    })
  }, [volumes])

  const summary = useMemo(() => {
    if (volumes.length === 0) return null
    const allIn = volumes.reduce((s, v) => s + v.inTop10, 0)
    const allCover = volumes.reduce((s, v) => s + v.coverCount, 0)
    const perfect = volumes.filter((v) => v.pctInTop10 === 100).length
    return {
      totalVolumes: volumes.length,
      totalCover: allCover,
      totalInTop10: allIn,
      pctOverall: Math.round((allIn / allCover) * 1000) / 10,
      perfectVolumes: perfect,
      pctPerfect: Math.round((perfect / volumes.length) * 1000) / 10,
    }
  }, [volumes])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <>
      {/* Summary stat cards */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Overall Match
          </div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">
            {summary.pctOverall}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            of cover chars are top-10 most appeared
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Perfect Match
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {summary.perfectVolumes}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            of {summary.totalVolumes} volumes ({summary.pctPerfect}%) have 100%
            overlap
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Cover Characters
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {summary.totalCover}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            total entries across {summary.totalVolumes} volumes
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            In Top 10
          </div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">
            {summary.totalInTop10}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            cover chars among top-10 appeared
          </div>
        </div>
      </div>

      {/* Per-volume: % of cover characters in top 10 */}
      <div className="mb-6">
        <ChartCard
          title="Do Volume Covers Represent the Story?"
          description="For each volume: what % of cover characters are among the 10 most-appeared characters in that volume's chapters?"
          downloadFileName="cover-representativeness"
          chartId="cover-representativeness"
          embedPath="/embed/insights/cover-representativeness"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={volumes}
              margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="volume"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{
                  value: 'Volume',
                  position: 'insideBottom',
                  offset: -15,
                  style: { fontSize: 12, fill: '#6b7280' },
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                label={{
                  value: '% of Cover Chars in Top 10',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 5,
                  style: { fontSize: 11, fill: '#6b7280' },
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as VolumeOverlap
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="font-semibold text-gray-900 mb-2">
                          Volume {d.volume}
                        </p>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-semibold text-emerald-600">
                            {d.inTop10}
                          </span>{' '}
                          of {d.coverCount} cover characters are in the top 10
                          most-appeared ({d.pctInTop10}%)
                        </p>
                        {d.insiders.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="text-emerald-600">In top 10:</span>{' '}
                            {d.insiders.join(', ')}
                          </p>
                        )}
                        {d.outsiders.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="text-orange-500">
                              Not in top 10:
                            </span>{' '}
                            {d.outsiders.join(', ')}
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="pctInTop10" radius={[4, 4, 0, 0]}>
                {volumes.map((v, i) => (
                  <Cell key={i} fill={barColor(v.pctInTop10)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-gray-600">
            {bucketCounts.map((b) => (
              <span key={b.label} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: b.color }}
                ></span>
                {b.label}:{' '}
                <span className="font-medium text-gray-900">{b.count}</span> vol
                ({b.pct}%)
              </span>
            ))}
          </div>
        </ChartCard>
      </div>
    </>
  )
}
