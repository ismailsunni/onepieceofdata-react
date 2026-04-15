/**
 * Precompute a "bar-chart race" dataset for character appearances.
 *
 * For each chapter N in [1..maxChapter], we score every character by their
 * appearance count in the trailing window [N - windowSize + 1 .. N] and keep
 * the top-K entries.
 *
 * Implemented with a sliding-window counter so the whole pass is O(total
 * appearances + C) rather than O(C * maxChapter) — Luffy alone has 1000+
 * chapters, so naive recomputation per frame gets expensive.
 */
import { hashId } from './wordCloud'

export interface RaceEntry {
  id: string
  name: string
  score: number
  isSHP: boolean
}

export interface RaceFrame {
  chapter: number
  entries: RaceEntry[]
}

export interface RaceComputeInput {
  characters: {
    id: string
    name: string | null
    chapter_list: number[] | null
  }[]
  shpIds: Set<string>
  windowSize: number
  topN: number
  shpFilter: 'all' | 'hide' | 'only'
}

export interface RaceResult {
  frames: RaceFrame[]
  minChapter: number
  maxChapter: number
}

/**
 * Build per-chapter top-N rankings over a sliding appearance window.
 *
 * `frames` is sparse-free: there is exactly one entry per chapter in
 * [minChapter..maxChapter]. Callers can index directly by chapter offset.
 */
export function computeRaceFrames(input: RaceComputeInput): RaceResult {
  const { characters, shpIds, windowSize, topN, shpFilter } = input

  // Normalize + apply SHP filter once, up-front.
  const validChars = characters
    .filter((c) => c.name && c.chapter_list && c.chapter_list.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name as string,
      isSHP: shpIds.has(c.id),
      chapters: c.chapter_list as number[],
    }))
    .filter((c) =>
      shpFilter === 'hide' ? !c.isSHP : shpFilter === 'only' ? c.isSHP : true
    )

  if (validChars.length === 0) {
    return { frames: [], minChapter: 1, maxChapter: 0 }
  }

  // Inverted index: chapter → character ids appearing in it.
  const chapterToChars = new Map<number, string[]>()
  const charById = new Map<string, (typeof validChars)[number]>()
  let maxCh = 0
  let minCh = Infinity
  for (const c of validChars) {
    charById.set(c.id, c)
    for (const ch of c.chapters) {
      if (ch > maxCh) maxCh = ch
      if (ch < minCh) minCh = ch
      const arr = chapterToChars.get(ch)
      if (arr) arr.push(c.id)
      else chapterToChars.set(ch, [c.id])
    }
  }
  const startChapter = Math.max(1, minCh)
  const endChapter = maxCh

  // Sliding window — scores only holds characters with nonzero counts so
  // the sort per frame scans O(|active|) rather than O(|all|).
  const scores = new Map<string, number>()
  const frames: RaceFrame[] = []

  for (let ch = startChapter; ch <= endChapter; ch++) {
    const entering = chapterToChars.get(ch)
    if (entering) {
      for (const id of entering) {
        scores.set(id, (scores.get(id) ?? 0) + 1)
      }
    }
    const leavingChapter = ch - windowSize
    if (leavingChapter >= startChapter) {
      const leaving = chapterToChars.get(leavingChapter)
      if (leaving) {
        for (const id of leaving) {
          const v = (scores.get(id) ?? 0) - 1
          if (v <= 0) scores.delete(id)
          else scores.set(id, v)
        }
      }
    }

    // Rank + slice top-N. hashId tiebreak keeps ordering stable when two
    // characters are tied — avoids visual jitter during playback.
    const ranked: RaceEntry[] = []
    for (const [id, score] of scores) {
      const c = charById.get(id)
      if (!c) continue
      ranked.push({ id, name: c.name, score, isSHP: c.isSHP })
    }
    ranked.sort((a, b) => b.score - a.score || hashId(a.id) - hashId(b.id))
    frames.push({ chapter: ch, entries: ranked.slice(0, topN) })
  }

  return { frames, minChapter: startChapter, maxChapter: endChapter }
}
