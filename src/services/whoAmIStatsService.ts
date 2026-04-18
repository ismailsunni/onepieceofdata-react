const STORAGE_KEY = 'opod-who-am-i-stats'

export interface WhoAmIStats {
  gamesPlayed: number
  bestScore: number
  totalScore: number
  totalCorrect: number
  totalRounds: number
}

const DEFAULT_STATS: WhoAmIStats = {
  gamesPlayed: 0,
  bestScore: 0,
  totalScore: 0,
  totalCorrect: 0,
  totalRounds: 0,
}

export function loadWhoAmIStats(): WhoAmIStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATS }
    return { ...DEFAULT_STATS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

export function saveWhoAmIGameResult(
  score: number,
  correctCount: number,
  roundCount: number
): WhoAmIStats {
  const stats = loadWhoAmIStats()

  stats.gamesPlayed += 1
  stats.totalScore += score
  stats.totalCorrect += correctCount
  stats.totalRounds += roundCount

  if (score > stats.bestScore) {
    stats.bestScore = score
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // localStorage full or unavailable
  }

  return stats
}
