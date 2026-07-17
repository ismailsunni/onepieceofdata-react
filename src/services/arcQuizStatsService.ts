import type { ArcQuizMode } from '../types/arcQuiz'

const STORAGE_KEY = 'opod-one-chapter-wonders-stats'

export interface ArcQuizStats {
  gamesPlayed: number
  bestScore: number
  bestRank: string
  totalScore: number
  totalCorrect: number
  totalQuestions: number
  currentStreak: number
  bestStreak: number
}

const DEFAULT_STATS: ArcQuizStats = {
  gamesPlayed: 0,
  bestScore: 0,
  bestRank: '',
  totalScore: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  currentStreak: 0,
  bestStreak: 0,
}

type StatsByMode = Partial<Record<ArcQuizMode, ArcQuizStats>>

function loadAll(): StatsByMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as StatsByMode
  } catch {
    return {}
  }
}

export function loadArcQuizStats(mode: ArcQuizMode): ArcQuizStats {
  return { ...DEFAULT_STATS, ...loadAll()[mode] }
}

export function saveArcQuizResult(
  mode: ArcQuizMode,
  score: number,
  rank: string,
  correctCount: number,
  questionCount: number
): ArcQuizStats {
  const all = loadAll()
  const stats = { ...DEFAULT_STATS, ...all[mode] }

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

  all[mode] = stats
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage full or unavailable — silently ignore
  }

  return stats
}
