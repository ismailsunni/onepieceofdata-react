import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchSagas } from '../services/sagaService'
import { fetchArcs } from '../services/arcService'
import { fetchChapters } from '../services/chapterService'
import { fetchCharacters } from '../services/characterService'
import type { Saga, Arc } from '../types/arc'
import type { Chapter } from '../types/chapter'
import type { Character } from '../types/character'

// Light background colors for saga bands (alternating). Shared with the
// CharacterTimelineChart palette so the saga colours feel consistent.
export const SAGA_COLORS = [
  '#3B82F6', // blue-500
  '#F97316', // orange-500
  '#22C55E', // green-500
  '#EC4899', // pink-500
  '#8B5CF6', // violet-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#0EA5E9', // sky-500
  '#EF4444', // red-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
  '#A855F7', // purple-500
]

export type TimelineLevel = 'saga' | 'arc' | 'chapter'

export interface TimelineData {
  sagas: Saga[]
  arcs: Arc[]
  chapters: Chapter[]
  characters: Character[]
  /** Highest chapter number present in the data (right edge of the timeline). */
  maxChapter: number
  /** Lowest chapter number present in the data (left edge of the timeline). */
  minChapter: number
  /** Largest single arc span, in chapters. */
  maxArcSpan: number
  /** Largest single saga span, in chapters. */
  maxSagaSpan: number
  /** saga_id -> colour (hex). */
  sagaColor: (sagaId: string | null | undefined) => string
  /** arc_id -> its parent saga_id (resolved via saga_id or chapter overlap). */
  arcSagaId: (arc: Arc) => string | null
  isLoading: boolean
  isError: boolean
}

/**
 * Fetches every entity needed by the interactive Story Timeline (sagas, arcs,
 * chapters and characters) and derives a handful of geometry/colour helpers.
 *
 * All four tables are small enough to load once and drill through entirely
 * client-side, so there are no per-id queries — the same cached results are
 * reused across the app (shared React Query keys).
 */
export function useTimelineData(): TimelineData {
  const sagasQuery = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
    staleTime: 10 * 60 * 1000,
  })
  const arcsQuery = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
    staleTime: 10 * 60 * 1000,
  })
  const chaptersQuery = useQuery({
    queryKey: ['chapters'],
    queryFn: fetchChapters,
    staleTime: 10 * 60 * 1000,
  })
  const charactersQuery = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: 10 * 60 * 1000,
  })

  const sagas = useMemo(() => sagasQuery.data ?? [], [sagasQuery.data])
  const arcs = useMemo(() => arcsQuery.data ?? [], [arcsQuery.data])
  const chapters = useMemo(() => chaptersQuery.data ?? [], [chaptersQuery.data])
  const characters = useMemo(
    () => charactersQuery.data ?? [],
    [charactersQuery.data]
  )

  return useMemo(() => {
    const sagaColorMap = new Map<string, string>()
    sagas.forEach((saga, i) => {
      sagaColorMap.set(saga.saga_id, SAGA_COLORS[i % SAGA_COLORS.length])
    })

    const arcSagaId = (arc: Arc): string | null => {
      if (arc.saga_id) return arc.saga_id
      const match = sagas.find(
        (s) =>
          arc.start_chapter >= s.start_chapter &&
          arc.start_chapter <= s.end_chapter
      )
      return match?.saga_id ?? null
    }

    const sagaColor = (sagaId: string | null | undefined): string =>
      (sagaId && sagaColorMap.get(sagaId)) || '#9CA3AF' // gray-400 fallback

    const chapterNumbers = chapters.map((c) => c.number)
    const sagaEnds = sagas.map((s) => s.end_chapter)
    const arcEnds = arcs.map((a) => a.end_chapter)
    const maxChapter = Math.max(1, ...chapterNumbers, ...sagaEnds, ...arcEnds)
    const sagaStarts = sagas.map((s) => s.start_chapter)
    const minChapter = Math.min(1, ...chapterNumbers, ...sagaStarts)

    const maxArcSpan = arcs.reduce(
      (m, a) => Math.max(m, a.end_chapter - a.start_chapter + 1),
      1
    )
    const maxSagaSpan = sagas.reduce(
      (m, s) => Math.max(m, s.end_chapter - s.start_chapter + 1),
      1
    )

    return {
      sagas,
      arcs,
      chapters,
      characters,
      maxChapter,
      minChapter,
      maxArcSpan,
      maxSagaSpan,
      sagaColor,
      arcSagaId,
      isLoading:
        sagasQuery.isLoading || arcsQuery.isLoading || chaptersQuery.isLoading,
      isError: sagasQuery.isError || arcsQuery.isError || chaptersQuery.isError,
    }
  }, [
    sagas,
    arcs,
    chapters,
    characters,
    sagasQuery.isLoading,
    arcsQuery.isLoading,
    chaptersQuery.isLoading,
    sagasQuery.isError,
    arcsQuery.isError,
    chaptersQuery.isError,
  ])
}
