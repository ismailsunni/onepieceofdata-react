import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons'
import { supabase } from '../services/supabase'
import { STRAW_HAT_COLORS } from '../constants/strawHatColors'

interface CharacterRow {
  id: string
  name: string | null
  status: string | null
  origin: string | null
  bounty: number | null
  appearance_count: number | null
  cover_appearance_count: number | null
  last_appearance: number | null
}

interface GapCharacterRow extends CharacterRow {
  gapStart: number
  gapEnd: number
  gapLength: number
}

interface SagaCountCharacterRow extends CharacterRow {
  sagaCount: number
}

interface ChapterBreakRow {
  fromChapter: number
  toChapter: number
  fromDate: string
  toDate: string
  days: number
}

interface ArcRow {
  arc_id: string
  title: string
  start_chapter: number
  end_chapter: number
  saga?: { title: string } | null
}

interface SagaRow {
  saga_id: string
  title: string
  start_chapter: number
  end_chapter: number
}

type RankingId =
  | 'most-seen'
  | 'most-seen-no-shp'
  | 'highest-bounty'
  | 'most-covers'
  | 'most-covers-no-shp'
  | 'most-sagas-no-shp'
  | 'longest-gap'
  | 'longest-chapter-break'
  | 'longest-arc'
  | 'longest-saga'

interface RankingDef {
  id: RankingId
  title: string
  subtitle: string
  metricLabel: string
}

const RANKINGS: RankingDef[] = [
  {
    id: 'most-seen',
    title: 'Most-seen characters',
    subtitle: 'Ranked by total chapter appearances.',
    metricLabel: 'chapters',
  },
  {
    id: 'most-seen-no-shp',
    title: 'Most-seen (excl. Straw Hats)',
    subtitle: 'Top chapter appearances, with the core crew excluded.',
    metricLabel: 'chapters',
  },
  {
    id: 'highest-bounty',
    title: 'Highest bounties',
    subtitle: 'Pirates with the largest known prices on their heads.',
    metricLabel: 'bounty',
  },
  {
    id: 'most-covers',
    title: 'Most cover appearances',
    subtitle: 'Characters featured most often on volume covers.',
    metricLabel: 'covers',
  },
  {
    id: 'most-covers-no-shp',
    title: 'Most covers (excl. Straw Hats)',
    subtitle: 'Top volume-cover appearances, with the core crew excluded.',
    metricLabel: 'covers',
  },
  {
    id: 'most-sagas-no-shp',
    title: 'Most sagas (excl. Straw Hats)',
    subtitle:
      'Non-crew characters who reappear across the most sagas of the story.',
    metricLabel: 'sagas',
  },
  {
    id: 'longest-gap',
    title: 'Longest disappearances',
    subtitle:
      'Biggest gap between consecutive appearances. Min. 20 total appearances.',
    metricLabel: 'chapters',
  },
  {
    id: 'longest-chapter-break',
    title: 'Longest breaks between chapters',
    subtitle: 'Largest real-world gaps between consecutive chapter releases.',
    metricLabel: 'days',
  },
  {
    id: 'longest-arc',
    title: 'Longest arcs',
    subtitle: 'Story arcs with the most chapters.',
    metricLabel: 'chapters',
  },
  {
    id: 'longest-saga',
    title: 'Longest sagas',
    subtitle: 'Sagas spanning the most chapters.',
    metricLabel: 'chapters',
  },
]

const characterSelect =
  'id, name, status, origin, bounty, appearance_count, cover_appearance_count, last_appearance'

function formatBounty(bounty: number | null): string {
  if (!bounty) return '—'
  if (bounty >= 1_000_000_000) return `฿${(bounty / 1_000_000_000).toFixed(2)}B`
  if (bounty >= 1_000_000) return `฿${(bounty / 1_000_000).toFixed(0)}M`
  return `฿${bounty.toLocaleString()}`
}

function CharacterAvatar({ id, name }: { id: string; name: string | null }) {
  const [errored, setErrored] = useState(false)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const url = `${supabaseUrl}/storage/v1/object/public/character-images/${encodeURIComponent(id)}.png`

  return (
    <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 shadow-sm">
      {!errored ? (
        <img
          src={url}
          alt={name || 'Character portrait'}
          loading="lazy"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold">
          {(name || '?').slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  )
}

function CharacterRowItem({
  c,
  rank,
  metric,
  metricLabel,
  subtitle,
}: {
  c: CharacterRow
  rank: number
  metric: string
  metricLabel: string
  subtitle?: string
}) {
  const fallback = [c.origin, c.status].filter(Boolean).join(' · ') || '—'
  return (
    <Link
      to={`/characters/${c.id}`}
      className="bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group flex items-center gap-4"
    >
      <div className="shrink-0 w-5 text-center text-sm font-bold text-gray-400 tabular-nums">
        {rank}
      </div>
      <CharacterAvatar id={c.id} name={c.name} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {c.name || 'Unknown'}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {subtitle ?? fallback}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-gray-900">{metric}</div>
        <div className="text-xs text-gray-500">{metricLabel}</div>
      </div>
    </Link>
  )
}

function ChapterBreakRowItem({
  b,
  rank,
  metricLabel,
}: {
  b: ChapterBreakRow
  rank: number
  metricLabel: string
}) {
  const fromDate = new Date(b.fromDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const toDate = new Date(b.toDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return (
    <Link
      to={`/chapters/${b.toChapter}`}
      className="bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group flex items-center gap-4"
    >
      <div className="shrink-0 w-5 text-center text-sm font-bold text-gray-400 tabular-nums">
        {rank}
      </div>
      <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold flex items-center justify-center text-xs text-center leading-tight border-2 border-gray-200 shadow-sm">
        Ch.
        <br />
        {b.toChapter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          Ch. {b.fromChapter} → Ch. {b.toChapter}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {fromDate} → {toDate}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-gray-900">
          {b.days.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500">{metricLabel}</div>
      </div>
    </Link>
  )
}

function ArcRowItem({
  a,
  rank,
  metricLabel,
}: {
  a: ArcRow
  rank: number
  metricLabel: string
}) {
  const span = a.end_chapter - a.start_chapter + 1
  return (
    <Link
      to={`/arcs/${a.arc_id}`}
      className="bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group flex items-center gap-4"
    >
      <div className="shrink-0 w-5 text-center text-sm font-bold text-gray-400 tabular-nums">
        {rank}
      </div>
      <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white font-bold flex items-center justify-center text-xl border-2 border-gray-200 shadow-sm">
        {a.title.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {a.title}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {a.saga?.title ? `${a.saga.title} · ` : ''}Ch. {a.start_chapter}–
          {a.end_chapter}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-gray-900">{span}</div>
        <div className="text-xs text-gray-500">{metricLabel}</div>
      </div>
    </Link>
  )
}

function SagaRowItem({
  s,
  rank,
  metricLabel,
}: {
  s: SagaRow
  rank: number
  metricLabel: string
}) {
  const span = s.end_chapter - s.start_chapter + 1
  return (
    <Link
      to={`/sagas/${s.saga_id}`}
      className="bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group flex items-center gap-4"
    >
      <div className="shrink-0 w-5 text-center text-sm font-bold text-gray-400 tabular-nums">
        {rank}
      </div>
      <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold flex items-center justify-center text-xl border-2 border-gray-200 shadow-sm">
        {s.title.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {s.title}
        </div>
        <div className="text-xs text-gray-500 truncate">
          Ch. {s.start_chapter}–{s.end_chapter}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-gray-900">{span}</div>
        <div className="text-xs text-gray-500">{metricLabel}</div>
      </div>
    </Link>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-50 border border-gray-200 rounded-xl p-3 h-20 animate-pulse"
        />
      ))}
    </div>
  )
}

function HomeSpotlight() {
  // Pick a random ranking on mount so the front page feels fresh on each visit.
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * RANKINGS.length)
  )
  const ranking = RANKINGS[index]
  const shpIds = useMemo(() => new Set(Object.keys(STRAW_HAT_COLORS)), [])

  const mostSeen = useQuery({
    queryKey: ['spotlight', 'most-seen'],
    queryFn: async (): Promise<CharacterRow[]> => {
      if (!supabase) return []
      const { data } = await supabase
        .from('character')
        .select(characterSelect)
        .eq('is_likely_character', true)
        .order('appearance_count', { ascending: false, nullsFirst: false })
        .limit(3)
      return data || []
    },
    enabled: ranking.id === 'most-seen',
  })

  const highestBounty = useQuery({
    queryKey: ['spotlight', 'highest-bounty'],
    queryFn: async (): Promise<CharacterRow[]> => {
      if (!supabase) return []
      const { data } = await supabase
        .from('character')
        .select(characterSelect)
        .eq('is_likely_character', true)
        .not('bounty', 'is', null)
        .order('bounty', { ascending: false, nullsFirst: false })
        .limit(3)
      return data || []
    },
    enabled: ranking.id === 'highest-bounty',
  })

  const mostCovers = useQuery({
    queryKey: ['spotlight', 'most-covers'],
    queryFn: async (): Promise<CharacterRow[]> => {
      if (!supabase) return []
      const { data } = await supabase
        .from('character')
        .select(characterSelect)
        .eq('is_likely_character', true)
        .order('cover_appearance_count', {
          ascending: false,
          nullsFirst: false,
        })
        .limit(3)
      return data || []
    },
    enabled: ranking.id === 'most-covers',
  })

  const mostSeenNoShp = useQuery({
    queryKey: ['spotlight', 'most-seen-no-shp'],
    queryFn: async (): Promise<CharacterRow[]> => {
      if (!supabase) return []
      const { data } = await supabase
        .from('character')
        .select(characterSelect)
        .eq('is_likely_character', true)
        .order('appearance_count', { ascending: false, nullsFirst: false })
        .limit(30)
      const rows = (data || []) as CharacterRow[]
      return rows.filter((r) => !shpIds.has(r.id)).slice(0, 3)
    },
    enabled: ranking.id === 'most-seen-no-shp',
  })

  const mostCoversNoShp = useQuery({
    queryKey: ['spotlight', 'most-covers-no-shp'],
    queryFn: async (): Promise<CharacterRow[]> => {
      if (!supabase) return []
      const { data } = await supabase
        .from('character')
        .select(characterSelect)
        .eq('is_likely_character', true)
        .order('cover_appearance_count', {
          ascending: false,
          nullsFirst: false,
        })
        .limit(30)
      const rows = (data || []) as CharacterRow[]
      return rows.filter((r) => !shpIds.has(r.id)).slice(0, 3)
    },
    enabled: ranking.id === 'most-covers-no-shp',
  })

  const mostSagasNoShp = useQuery({
    queryKey: ['spotlight', 'most-sagas-no-shp'],
    queryFn: async (): Promise<SagaCountCharacterRow[]> => {
      if (!supabase) return []
      // saga_list is a text[] — PostgREST can't ORDER BY its length, so pull
      // a candidate slice (high appearance_count) and rank client-side.
      const { data } = await supabase
        .from('character')
        .select(`${characterSelect}, saga_list`)
        .eq('is_likely_character', true)
        .gte('appearance_count', 30)
        .limit(300)
      const rows =
        (data as (CharacterRow & { saga_list: string[] | null })[] | null) || []
      return rows
        .filter((r) => !shpIds.has(r.id))
        .map((r) => ({
          ...r,
          sagaCount: r.saga_list?.length ?? 0,
        }))
        .sort((a, b) => b.sagaCount - a.sagaCount)
        .slice(0, 3)
    },
    enabled: ranking.id === 'most-sagas-no-shp',
  })

  const longestGap = useQuery({
    queryKey: ['spotlight', 'longest-gap'],
    queryFn: async (): Promise<GapCharacterRow[]> => {
      if (!supabase) return []
      // Mirrors the gap-analysis chart's logic: max distance between two
      // consecutive entries in chapter_list. Filter by a meaningful
      // appearance count so cameos don't dominate the result.
      const { data } = await supabase
        .from('character')
        .select(`${characterSelect}, chapter_list`)
        .eq('is_likely_character', true)
        .gte('appearance_count', 20)
        .limit(500)
      const rows =
        (data as (CharacterRow & { chapter_list: number[] | null })[] | null) ||
        []
      const enriched: GapCharacterRow[] = []
      for (const r of rows) {
        if (!r.chapter_list || r.chapter_list.length < 2) continue
        const sorted = [...r.chapter_list].sort((a, b) => a - b)
        let maxGap = 0
        let gapStart = 0
        let gapEnd = 0
        for (let i = 1; i < sorted.length; i++) {
          const gap = sorted[i] - sorted[i - 1]
          if (gap > maxGap) {
            maxGap = gap
            gapStart = sorted[i - 1]
            gapEnd = sorted[i]
          }
        }
        if (maxGap > 50) {
          enriched.push({ ...r, gapStart, gapEnd, gapLength: maxGap })
        }
      }
      return enriched.sort((a, b) => b.gapLength - a.gapLength).slice(0, 3)
    },
    enabled: ranking.id === 'longest-gap',
  })

  const longestChapterBreak = useQuery({
    queryKey: ['spotlight', 'longest-chapter-break'],
    queryFn: async (): Promise<ChapterBreakRow[]> => {
      if (!supabase) return []
      const { data } = await supabase
        .from('chapter')
        .select('number, date')
        .not('date', 'is', null)
        .order('number', { ascending: true })
      const rows = (data as { number: number; date: string }[] | null) || []
      const breaks: ChapterBreakRow[] = []
      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1]
        const curr = rows[i]
        const days = Math.round(
          (new Date(curr.date).getTime() - new Date(prev.date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        breaks.push({
          fromChapter: prev.number,
          toChapter: curr.number,
          fromDate: prev.date,
          toDate: curr.date,
          days,
        })
      }
      return breaks.sort((a, b) => b.days - a.days).slice(0, 3)
    },
    enabled: ranking.id === 'longest-chapter-break',
  })

  const longestArc = useQuery({
    queryKey: ['spotlight', 'longest-arc'],
    queryFn: async (): Promise<ArcRow[]> => {
      if (!supabase) return []
      // PostgREST has no "ORDER BY (end_chapter - start_chapter)" — pull a
      // generous slice and sort client-side.
      const { data } = await supabase
        .from('arc')
        .select('arc_id, title, start_chapter, end_chapter, saga:saga(title)')
      const rows = (data as ArcRow[] | null) || []
      return rows
        .slice()
        .sort(
          (a, b) =>
            b.end_chapter - b.start_chapter - (a.end_chapter - a.start_chapter)
        )
        .slice(0, 3)
    },
    enabled: ranking.id === 'longest-arc',
  })

  const longestSaga = useQuery({
    queryKey: ['spotlight', 'longest-saga'],
    queryFn: async (): Promise<SagaRow[]> => {
      if (!supabase) return []
      const { data } = await supabase
        .from('saga')
        .select('saga_id, title, start_chapter, end_chapter')
      const rows = (data as SagaRow[] | null) || []
      return rows
        .slice()
        .sort(
          (a, b) =>
            b.end_chapter - b.start_chapter - (a.end_chapter - a.start_chapter)
        )
        .slice(0, 3)
    },
    enabled: ranking.id === 'longest-saga',
  })

  const isLoading = useMemo(() => {
    switch (ranking.id) {
      case 'most-seen':
        return mostSeen.isLoading
      case 'highest-bounty':
        return highestBounty.isLoading
      case 'most-covers':
        return mostCovers.isLoading
      case 'most-seen-no-shp':
        return mostSeenNoShp.isLoading
      case 'most-covers-no-shp':
        return mostCoversNoShp.isLoading
      case 'most-sagas-no-shp':
        return mostSagasNoShp.isLoading
      case 'longest-gap':
        return longestGap.isLoading
      case 'longest-chapter-break':
        return longestChapterBreak.isLoading
      case 'longest-arc':
        return longestArc.isLoading
      case 'longest-saga':
        return longestSaga.isLoading
    }
  }, [
    ranking.id,
    mostSeen.isLoading,
    highestBounty.isLoading,
    mostCovers.isLoading,
    mostSeenNoShp.isLoading,
    mostCoversNoShp.isLoading,
    mostSagasNoShp.isLoading,
    longestGap.isLoading,
    longestChapterBreak.isLoading,
    longestArc.isLoading,
    longestSaga.isLoading,
  ])

  const prev = () =>
    setIndex((i) => (i - 1 + RANKINGS.length) % RANKINGS.length)
  const next = () => setIndex((i) => (i + 1) % RANKINGS.length)

  const renderRows = () => {
    if (isLoading) return <SkeletonRows />

    switch (ranking.id) {
      case 'most-seen':
        return (
          <div className="space-y-3">
            {mostSeen.data?.map((c, i) => (
              <CharacterRowItem
                key={c.id}
                c={c}
                rank={i + 1}
                metric={(c.appearance_count ?? 0).toLocaleString()}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
      case 'highest-bounty':
        return (
          <div className="space-y-3">
            {highestBounty.data?.map((c, i) => (
              <CharacterRowItem
                key={c.id}
                c={c}
                rank={i + 1}
                metric={formatBounty(c.bounty)}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
      case 'most-covers':
        return (
          <div className="space-y-3">
            {mostCovers.data?.map((c, i) => (
              <CharacterRowItem
                key={c.id}
                c={c}
                rank={i + 1}
                metric={(c.cover_appearance_count ?? 0).toLocaleString()}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
      case 'most-seen-no-shp':
        return (
          <div className="space-y-3">
            {mostSeenNoShp.data?.map((c, i) => (
              <CharacterRowItem
                key={c.id}
                c={c}
                rank={i + 1}
                metric={(c.appearance_count ?? 0).toLocaleString()}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
      case 'most-covers-no-shp':
        return (
          <div className="space-y-3">
            {mostCoversNoShp.data?.map((c, i) => (
              <CharacterRowItem
                key={c.id}
                c={c}
                rank={i + 1}
                metric={(c.cover_appearance_count ?? 0).toLocaleString()}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
      case 'most-sagas-no-shp':
        return (
          <div className="space-y-3">
            {mostSagasNoShp.data?.map((c, i) => (
              <CharacterRowItem
                key={c.id}
                c={c}
                rank={i + 1}
                metric={c.sagaCount.toLocaleString()}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
      case 'longest-gap':
        return (
          <div className="space-y-3">
            {longestGap.data?.map((c, i) => (
              <CharacterRowItem
                key={c.id}
                c={c}
                rank={i + 1}
                metric={c.gapLength.toLocaleString()}
                metricLabel={ranking.metricLabel}
                subtitle={`Ch. ${c.gapStart} → ${c.gapEnd} · ${(c.appearance_count ?? 0).toLocaleString()} total apps`}
              />
            ))}
          </div>
        )
      case 'longest-chapter-break':
        return (
          <div className="space-y-3">
            {longestChapterBreak.data?.map((b, i) => (
              <ChapterBreakRowItem
                key={`${b.fromChapter}-${b.toChapter}`}
                b={b}
                rank={i + 1}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
      case 'longest-arc':
        return (
          <div className="space-y-3">
            {longestArc.data?.map((a, i) => (
              <ArcRowItem
                key={a.arc_id}
                a={a}
                rank={i + 1}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
      case 'longest-saga':
        return (
          <div className="space-y-3">
            {longestSaga.data?.map((s, i) => (
              <SagaRowItem
                key={s.saga_id}
                s={s}
                rank={i + 1}
                metricLabel={ranking.metricLabel}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 truncate">
            {ranking.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{ranking.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous ranking"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next ranking"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {renderRows()}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          {RANKINGS.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${r.title}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? 'w-6 bg-blue-600'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
        <span aria-hidden="true" className="hidden sm:inline">
          <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3 mr-1" />/
          <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 ml-1" /> to
          cycle rankings
        </span>
      </div>
    </div>
  )
}

export default HomeSpotlight
