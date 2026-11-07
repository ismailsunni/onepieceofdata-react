import type { Character } from '../types/character'
import type { Arc, Saga } from '../types/arc'

export const TIME_SKIP_CHAPTER = 598

export type RollCallScopeType = 'arc' | 'saga' | 'half' | 'all'

export const SCOPE_TYPES: {
  id: RollCallScopeType
  label: string
  minutes: number
}[] = [
  { id: 'arc', label: 'Arc', minutes: 10 },
  { id: 'saga', label: 'Saga', minutes: 15 },
  { id: 'half', label: 'Time Skip', minutes: 30 },
  { id: 'all', label: 'All', minutes: 60 },
]

export const scopeSeconds = (type: RollCallScopeType): number =>
  (SCOPE_TYPES.find((t) => t.id === type)?.minutes ?? 10) * 60

export interface RollCallScope {
  type: RollCallScopeType
  id: string
  title: string
  start: number
  end: number
}

export interface RollCallGuess {
  id: string
  name: string
  correct: boolean
}

export function isGuessable(c: Character): boolean {
  return !!c.name && c.is_likely_character !== false
}

export function charactersInScope(
  characters: Character[],
  { start, end }: RollCallScope
): Character[] {
  return characters.filter(
    (c) =>
      isGuessable(c) && !!c.chapter_list?.some((ch) => ch >= start && ch <= end)
  )
}

const scope = (
  type: RollCallScopeType,
  id: string,
  name: string,
  start: number,
  end: number
): RollCallScope => ({
  type,
  id,
  title: `${name} (Ch. ${start}–${end})`,
  start,
  end,
})

export function buildScopes(
  type: RollCallScopeType,
  arcs: Arc[],
  sagas: Saga[]
): RollCallScope[] {
  const last = Math.max(0, ...sagas.map((s) => s.end_chapter))
  switch (type) {
    case 'arc':
      return arcs.map((a) =>
        scope(type, a.arc_id, a.title, a.start_chapter, a.end_chapter)
      )
    case 'saga':
      return sagas.map((s) =>
        scope(type, s.saga_id, s.title, s.start_chapter, s.end_chapter)
      )
    case 'half':
      return [
        scope(type, 'pre', 'Before Time Skip', 1, TIME_SKIP_CHAPTER - 1),
        scope(type, 'post', 'After Time Skip', TIME_SKIP_CHAPTER, last),
      ]
    case 'all':
      return [scope(type, 'all', 'All One Piece', 1, last)]
  }
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
