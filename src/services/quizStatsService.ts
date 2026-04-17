const STORAGE_KEY = 'opod-guess-character-stats'

export interface QuizStats {
  gamesPlayed: number
  bestScore: number
  bestRank: string
  totalScore: number
  totalCorrect: number
  totalQuestions: number
  currentStreak: number // consecutive games with at least 1 correct
  bestStreak: number
}

const DEFAULT_STATS: QuizStats = {
  gamesPlayed: 0,
  bestScore: 0,
  bestRank: '',
  totalScore: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  currentStreak: 0,
  bestStreak: 0,
}

export function loadStats(): QuizStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATS }
    return { ...DEFAULT_STATS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

export function saveGameResult(
  score: number,
  rank: string,
  correctCount: number,
  questionCount: number
): QuizStats {
  const stats = loadStats()

  stats.gamesPlayed += 1
  stats.totalScore += score
  stats.totalCorrect += correctCount
  stats.totalQuestions += questionCount

  if (score > stats.bestScore) {
    stats.bestScore = score
    stats.bestRank = rank
  }

  if (correctCount > 0) {
    stats.currentStreak += 1
  } else {
    stats.currentStreak = 0
  }

  if (stats.currentStreak > stats.bestStreak) {
    stats.bestStreak = stats.currentStreak
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // localStorage full or unavailable — silently ignore
  }

  return stats
}
