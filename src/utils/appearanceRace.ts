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
 *
 * Two scoring modes:
 *   - 'window': hard sliding window count; each chapter in the window adds 1.
 *   - 'decay': exponential decay with half-life = windowSize. Older
 *              appearances fade smoothly instead of dropping off a cliff,
 *              producing calmer bar-width animations.
 *
 * Optional rank hysteresis (`hysteresisMargin > 0`) prevents flicker between
 * near-tied characters: we only swap two ranks when their score gap exceeds
 * the margin, otherwise we preserve the previous frame's relative order.
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

export type RaceScoringMode = 'window' | 'decay' | 'cumulative'

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
  /** Defaults to 'window' for backwards compatibility. */
  scoringMode?: RaceScoringMode
  /**
   * If > 0, require this score gap before swapping two characters' ranks;
   * otherwise keep the previous frame's relative order. Kills near-tie
   * flicker. Set to 0 to disable.
   */
  hysteresisMargin?: number
  /**
   * Hysteresis only kicks in for ranks ≥ this value (1-indexed). Lower
   * ranks (1 .. hysteresisMinRank-1) always follow raw score order so the
   * top of the board stays truthful. Defaults to 1 (apply everywhere).
   */
  hysteresisMinRank?: number
}

export interface RaceResult {
  frames: RaceFrame[]
  minChapter: number
  maxChapter: number
  /**
   * Theoretical ceiling of `entry.score` for the chosen scoring mode. Used
   * by callers to normalise bar widths. For 'window' this is `windowSize`;
   * for 'decay' it's the geometric sum `1 / (1 - decay)`.
   */
  maxScore: number
}

/**
 * Build per-chapter top-N rankings over a sliding appearance window.
 *
 * `frames` is sparse-free: there is exactly one entry per chapter in
 * [minChapter..maxChapter]. Callers can index directly by chapter offset.
 */
export function computeRaceFrames(input: RaceComputeInput): RaceResult {
  const {
    characters,
    shpIds,
    windowSize,
    topN,
    shpFilter,
    scoringMode = 'window',
    hysteresisMargin = 0,
    hysteresisMinRank = 1,
  } = input

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

  // Decay factor: half-life = windowSize chapters, so after windowSize
  // chapters an appearance's weight drops to 0.5. `maxScore` is the
  // geometric-series limit if a character appeared in *every* chapter.
  const decay =
    scoringMode === 'decay' ? Math.pow(0.5, 1 / Math.max(1, windowSize)) : 0
  // For cumulative mode maxScore is set after the loop (we don't know the
  // final leader's score yet); initialise to 1 to avoid division by zero.
  let maxScore =
    scoringMode === 'decay'
      ? 1 / (1 - decay)
      : scoringMode === 'cumulative'
        ? 1
        : windowSize

  if (validChars.length === 0) {
    return { frames: [], minChapter: 1, maxChapter: 0, maxScore }
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

  // Below this score, drop from active set so the map doesn't grow
  // unboundedly in decay mode (contribution is visually negligible).
  const PRUNE_EPSILON = 0.01

  const scores = new Map<string, number>()
  const frames: RaceFrame[] = []
  // Previous frame's rank for each character (1-indexed among ranked list).
  // Drives the hysteresis bubble-pass below.
  let prevRanks = new Map<string, number>()

  for (let ch = startChapter; ch <= endChapter; ch++) {
    if (scoringMode === 'decay') {
      // Multiply all active scores by decay, prune anything negligible.
      for (const [id, v] of scores) {
        const next = v * decay
        if (next < PRUNE_EPSILON) scores.delete(id)
        else scores.set(id, next)
      }
      const entering = chapterToChars.get(ch)
      if (entering) {
        for (const id of entering) {
          scores.set(id, (scores.get(id) ?? 0) + 1)
        }
      }
    } else if (scoringMode === 'cumulative') {
      // Pure running total — never subtract.
      const entering = chapterToChars.get(ch)
      if (entering) {
        for (const id of entering) {
          scores.set(id, (scores.get(id) ?? 0) + 1)
        }
      }
    } else {
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
    }

    // Rank. hashId tiebreak keeps exact ties stable across frames.
    const ranked: RaceEntry[] = []
    for (const [id, score] of scores) {
      const c = charById.get(id)
      if (!c) continue
      ranked.push({ id, name: c.name, score, isSHP: c.isSHP })
    }
    ranked.sort((a, b) => b.score - a.score || hashId(a.id) - hashId(b.id))

    // Hysteresis bubble-pass: if neighbour (i+1) was previously ranked
    // higher than (i), and their score gap is within the margin, swap them
    // back. Kills flicker between near-tied characters without freezing
    // legitimate rank changes (a gap > margin always wins). O(N²) worst
    // case but only runs over a small top slice.
    //
    // Only applied from rank `hysteresisMinRank` downward — the leaderboard
    // top stays truthful (sorted purely by score) while the noisier lower
    // ranks get stabilized.
    if (hysteresisMargin > 0 && prevRanks.size > 0) {
      const SLICE = Math.min(ranked.length, topN * 2)
      const startI = Math.max(0, hysteresisMinRank - 1)
      let changed = true
      let guard = 0
      while (changed && guard++ < SLICE) {
        changed = false
        for (let i = startI; i < SLICE - 1; i++) {
          const a = ranked[i]
          const b = ranked[i + 1]
          const pa = prevRanks.get(a.id) ?? Infinity
          const pb = prevRanks.get(b.id) ?? Infinity
          if (pb < pa && a.score - b.score <= hysteresisMargin) {
            ranked[i] = b
            ranked[i + 1] = a
            changed = true
          }
        }
      }
    }

    // Snapshot ranks for next frame's hysteresis pass — only track the
    // slice we compared, everything beyond is treated as "unranked".
    const nextPrev = new Map<string, number>()
    const snapLimit = Math.min(ranked.length, topN * 2)
    for (let i = 0; i < snapLimit; i++) {
      nextPrev.set(ranked[i].id, i + 1)
    }
    prevRanks = nextPrev

    frames.push({ chapter: ch, entries: ranked.slice(0, topN) })
  }

  // For cumulative mode, maxScore is the leader's score in the last frame.
  if (scoringMode === 'cumulative' && frames.length > 0) {
    const last = frames[frames.length - 1].entries
    maxScore = last.length > 0 ? last[0].score : 1
  }

  return {
    frames,
    minChapter: startChapter,
    maxChapter: endChapter,
    maxScore,
  }
}
