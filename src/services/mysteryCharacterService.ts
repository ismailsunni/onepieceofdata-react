import type { Character } from '../types/character'
import type { Arc, Saga } from '../types/arc'
import type { CharacterAffiliation } from '../types/affiliation'
import type { CharacterDevilFruit } from '../types/devilFruit'

export const MAX_GUESSES = 8
const MIN_ANSWER_CHAPTERS = 30
const ANSWER_TIERS = ['S', 'A', 'B']

export interface Profile {
  id: string
  name: string
  debutArc: { idx: number; title: string } | null
  debutSaga: { idx: number; title: string } | null
  chapters: number
  arcs: number
  bounty: number | null
  origin: string
  status: string
  fruit: string
  groups: string[]
  chapterList: number[]
}

export interface Db {
  profiles: Map<string, Profile>
  guessable: Character[]
  answers: Profile[]
  chapterIndex: Map<number, string[]>
}

const findIdx = (
  list: { start_chapter: number; end_chapter: number }[],
  ch: number
) => list.findIndex((x) => ch >= x.start_chapter && ch <= x.end_chapter)

export function buildDb(
  characters: Character[],
  arcs: Arc[],
  sagas: Saga[],
  fruits: CharacterDevilFruit[],
  affiliations: CharacterAffiliation[]
): Db {
  const fruitBy = new Map(fruits.map((f) => [f.character_id, f.fruit_type]))
  const groupsBy = new Map<string, string[]>()
  for (const a of affiliations) {
    groupsBy.set(a.character_id, [
      ...(groupsBy.get(a.character_id) ?? []),
      a.group_name,
    ])
  }

  const guessable = characters.filter(
    (c) => c.name && c.is_likely_character !== false && c.chapter_list?.length
  )
  const profiles = new Map<string, Profile>()
  const chapterIndex = new Map<number, string[]>()

  for (const c of guessable) {
    const chapterList = c.chapter_list!
    const debut = c.first_appearance ?? Math.min(...chapterList)
    const ai = findIdx(arcs, debut)
    const si = findIdx(sagas, debut)
    profiles.set(c.id, {
      id: c.id,
      name: c.name!,
      debutArc: ai >= 0 ? { idx: ai, title: arcs[ai].title } : null,
      debutSaga: si >= 0 ? { idx: si, title: sagas[si].title } : null,
      chapters: c.appearance_count ?? chapterList.length,
      arcs: c.arc_list?.length ?? 0,
      bounty: c.bounty,
      origin: c.origin_region ?? 'Unknown',
      status: c.status ?? 'Unknown',
      fruit: fruitBy.get(c.id) ?? 'None',
      groups: groupsBy.get(c.id) ?? [],
      chapterList,
    })
    for (const ch of chapterList) {
      chapterIndex.set(ch, [...(chapterIndex.get(ch) ?? []), c.id])
    }
  }

  const answers = guessable
    .filter(
      (c) =>
        ANSWER_TIERS.includes(c.importance_tier ?? '') &&
        profiles.get(c.id)!.chapters >= MIN_ANSWER_CHAPTERS
    )
    .map((c) => profiles.get(c.id)!)
    .sort((a, b) => a.id.localeCompare(b.id))

  return { profiles, guessable, answers, chapterIndex }
}

export type Dir = 'up' | 'down' | null

export interface Clue {
  label: string
  value: string
  exact: boolean
  dir: Dir
}

const dir = (guess: number, answer: number): Dir =>
  answer > guess ? 'up' : answer < guess ? 'down' : null

export function formatBounty(b: number | null): string {
  if (!b) return 'None'
  if (b >= 1e9) return `${+(b / 1e9).toFixed(2)}B`
  if (b >= 1e6) return `${+(b / 1e6).toFixed(1)}M`
  return b.toLocaleString()
}

export function compare(g: Profile, a: Profile): Clue[] {
  const ordered = (
    label: string,
    gv: { idx: number; title: string } | null,
    av: { idx: number; title: string } | null
  ): Clue => ({
    label,
    value: gv?.title ?? 'Unknown',
    exact: gv?.idx === av?.idx,
    dir: gv && av ? dir(gv.idx, av.idx) : null,
  })
  const num = (
    label: string,
    gv: number,
    av: number,
    value = String(gv)
  ): Clue => ({
    label,
    value,
    exact: gv === av,
    dir: dir(gv, av),
  })
  const same = (label: string, gv: string, av: string): Clue => ({
    label,
    value: gv,
    exact: gv === av,
    dir: null,
  })
  const shared = g.groups.find((x) => a.groups.includes(x))

  return [
    ordered('Debut arc', g.debutArc, a.debutArc),
    ordered('Debut saga', g.debutSaga, a.debutSaga),
    num('Chapters', g.chapters, a.chapters),
    num('Arcs', g.arcs, a.arcs),
    num('Bounty', g.bounty ?? 0, a.bounty ?? 0, formatBounty(g.bounty)),
    same('Origin', g.origin, a.origin),
    same('Status', g.status, a.status),
    same('Devil fruit', g.fruit, a.fruit),
    {
      label: 'Affiliation',
      value: shared ?? 'None shared',
      exact: !!shared,
      dir: null,
    },
  ]
}

/** Chapters both appear in, or co-appearance steps apart (BFS) if none. */
export function relation(
  db: Db,
  g: Profile,
  a: Profile
): { together: number } | { steps: number | null } {
  const answerChapters = new Set(a.chapterList)
  const together = g.chapterList.filter((ch) => answerChapters.has(ch)).length
  if (together > 0) return { together }

  const seenChars = new Set([g.id])
  const seenChapters = new Set<number>()
  let frontier = [g.id]
  for (let steps = 1; frontier.length; steps++) {
    const next: string[] = []
    for (const id of frontier) {
      for (const ch of db.profiles.get(id)!.chapterList) {
        if (seenChapters.has(ch)) continue
        seenChapters.add(ch)
        for (const other of db.chapterIndex.get(ch) ?? []) {
          if (other === a.id) return { steps }
          if (!seenChars.has(other)) {
            seenChars.add(other)
            next.push(other)
          }
        }
      }
    }
    frontier = next
  }
  return { steps: null }
}

export const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** FNV-1a hash of the date: same answer for everyone on a given day. */
export function dailyAnswer(answers: Profile[], date: string): Profile {
  let h = 0x811c9dc5
  for (const ch of `opod-mystery-${date}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return answers[h % answers.length]
}
