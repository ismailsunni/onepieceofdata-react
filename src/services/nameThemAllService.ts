import type { Character } from '../types/character'
import type { Arc, Saga } from '../types/arc'

export const TIME_SKIP_CHAPTER = 598

export type NameThemAllScopeType = 'arc' | 'saga' | 'half' | 'all'

export const SCOPE_TYPES: {
  id: NameThemAllScopeType
  label: string
  minutes: number
}[] = [
  { id: 'arc', label: 'Arc', minutes: 10 },
  { id: 'saga', label: 'Saga', minutes: 15 },
  { id: 'half', label: 'Time Skip', minutes: 30 },
  { id: 'all', label: 'All', minutes: 60 },
]

export const scopeSeconds = (type: NameThemAllScopeType): number =>
  (SCOPE_TYPES.find((t) => t.id === type)?.minutes ?? 10) * 60

export interface NameThemAllScope {
  type: NameThemAllScopeType
  id: string
  title: string
  start: number
  end: number
}

export interface NameThemAllGuess {
  id: string
  name: string
  correct: boolean
}

export function isGuessable(c: Character): boolean {
  return !!c.name && c.is_likely_character !== false
}

export function charactersInScope(
  characters: Character[],
  { start, end }: NameThemAllScope
): Character[] {
  return characters.filter(
    (c) =>
      isGuessable(c) && !!c.chapter_list?.some((ch) => ch >= start && ch <= end)
  )
}

const scope = (
  type: NameThemAllScopeType,
  id: string,
  name: string,
  start: number,
  end: number
): NameThemAllScope => ({
  type,
  id,
  title: `${name} (Ch. ${start}–${end})`,
  start,
  end,
})

export function buildScopes(
  type: NameThemAllScopeType,
  arcs: Arc[],
  sagas: Saga[]
): NameThemAllScope[] {
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

export const normalizeName = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[b.length]
}

/** Typos allowed for an input: none for short names, up to 2 for long ones. */
const maxTypos = (len: number) => (len <= 3 ? 0 : len <= 6 ? 1 : 2)

export type NameMatch =
  | { kind: 'match'; character: Character }
  | { kind: 'ambiguous' }
  | { kind: 'none' }

/**
 * Match free text against character names (full name or any single word of
 * it, e.g. "Luffy"), allowing a few typos. Ties between characters are
 * reported as ambiguous.
 */
export function matchCharacterName(
  input: string,
  characters: Character[]
): NameMatch {
  const q = normalizeName(input)
  if (!q) return { kind: 'none' }
  const limit = maxTypos(q.length)

  let best = Infinity
  let hits: Character[] = []
  for (const c of characters) {
    const full = normalizeName(c.name ?? '')
    const keys = [full, ...full.split(' ').filter((w) => w.length >= 3)]
    const d = Math.min(...keys.map((k) => levenshtein(q, k)))
    if (d > limit || d > best) continue
    if (d < best) {
      best = d
      hits = []
    }
    hits.push(c)
  }

  if (hits.length === 0) return { kind: 'none' }
  if (hits.length === 1) return { kind: 'match', character: hits[0] }
  const exact = hits.filter((c) => normalizeName(c.name ?? '') === q)
  if (exact.length === 1) return { kind: 'match', character: exact[0] }
  return { kind: 'ambiguous' }
}
