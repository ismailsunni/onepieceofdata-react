const STORAGE_KEY = 'opod-name-them-all-stats'

export interface NameThemAllStats {
  gamesPlayed: number
  bestCorrect: number
  bestWrong: number
  total: number
}

const DEFAULT_STATS: NameThemAllStats = {
  gamesPlayed: 0,
  bestCorrect: 0,
  bestWrong: 0,
  total: 0,
}

function loadAll(): Record<string, NameThemAllStats> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function loadNameThemAllStats(key: string): NameThemAllStats {
  return { ...DEFAULT_STATS, ...loadAll()[key] }
}

/** Record a game for a round; best = most correct, then fewest wrong. */
export function saveNameThemAllResult(
  key: string,
  correct: number,
  wrong: number,
  total: number
): { stats: NameThemAllStats; isNewBest: boolean } {
  const all = loadAll()
  const prev = { ...DEFAULT_STATS, ...all[key] }
  const isNewBest =
    prev.gamesPlayed === 0 ||
    correct > prev.bestCorrect ||
    (correct === prev.bestCorrect && wrong < prev.bestWrong)

  const stats: NameThemAllStats = isNewBest
    ? {
        gamesPlayed: prev.gamesPlayed + 1,
        bestCorrect: correct,
        bestWrong: wrong,
        total,
      }
    : { ...prev, gamesPlayed: prev.gamesPlayed + 1 }

  all[key] = stats
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage full or unavailable — ignore
  }
  return { stats, isNewBest }
}
