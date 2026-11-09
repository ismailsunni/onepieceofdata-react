import { MAX_GUESSES } from './mysteryCharacterService'

const STORAGE_KEY = 'opod-mystery-character-stats'

export type MysteryMode = 'daily' | 'practice'

export interface MysteryStats {
  played: number
  wins: number
  currentStreak: number
  bestStreak: number
  bestGuesses: number // fewest guesses in a win; 0 = no win yet
  distribution: number[] // wins by guess count, index 0 = 1 guess
}

const empty = (): MysteryStats => ({
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestGuesses: 0,
  distribution: Array(MAX_GUESSES).fill(0),
})

function loadAll(): Partial<Record<MysteryMode, MysteryStats>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function loadMysteryStats(mode: MysteryMode): MysteryStats {
  return { ...empty(), ...loadAll()[mode] }
}

/** Record a finished game; `guesses` is the winning guess count, or null for a loss. */
export function saveMysteryResult(
  mode: MysteryMode,
  guesses: number | null
): { stats: MysteryStats; isNewBest: boolean } {
  const all = loadAll()
  const s = { ...empty(), ...all[mode] }
  const isNewBest =
    guesses !== null && (s.bestGuesses === 0 || guesses < s.bestGuesses)

  s.played += 1
  if (guesses !== null) {
    s.wins += 1
    s.currentStreak += 1
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak)
    s.distribution = s.distribution.map((n, i) =>
      i === guesses - 1 ? n + 1 : n
    )
    if (isNewBest) s.bestGuesses = guesses
  } else {
    s.currentStreak = 0
  }

  all[mode] = s
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // storage unavailable
  }
  return { stats: s, isNewBest }
}
