import type { Character } from '../types/character'
import type { QuizCharacter, QuizQuestion } from '../types/quiz'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

// Difficulty tiers: Q1 easiest → Q5 hardest
const TIERS = [
  { tier: 1, min: 200, max: Infinity }, // Main cast
  { tier: 2, min: 100, max: 199 }, // Major recurring
  { tier: 3, min: 50, max: 99 }, // Significant supporting
  { tier: 4, min: 20, max: 49 }, // Notable minor
  { tier: 5, min: 0, max: 19 }, // Rare/obscure (filtered by eligibility)
]

export function getCharacterImageUrl(characterId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/character-images/${encodeURIComponent(characterId)}.png`
}

function isEligibleForQuiz(char: Character): boolean {
  if (!char.name) return false
  if (char.appearance_count === null || char.appearance_count === undefined)
    return false
  // Exclude under 5 appearances UNLESS they have a bounty
  if (char.appearance_count < 5 && (!char.bounty || char.bounty <= 0))
    return false
  return true
}

function getCharacterTier(char: Character): number {
  const count = char.appearance_count ?? 0
  for (const { tier, min, max } of TIERS) {
    if (count >= min && count <= max) return tier
  }
  return 5 // fallback to hardest tier
}

function toQuizCharacter(char: Character): QuizCharacter {
  return {
    id: char.id,
    name: char.name!,
    appearance_count: char.appearance_count ?? 0,
    bounty: char.bounty,
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * Generate 5 quiz questions from a list of characters.
 * Returns null if there aren't enough characters to build the quiz.
 */
export async function generateQuizQuestions(
  characters: Character[]
): Promise<QuizQuestion[] | null> {
  const eligible = characters.filter(isEligibleForQuiz)

  // Bucket characters into tiers
  const buckets: Map<number, QuizCharacter[]> = new Map()
  for (let i = 1; i <= 5; i++) buckets.set(i, [])

  for (const char of eligible) {
    const tier = getCharacterTier(char)
    buckets.get(tier)!.push(toQuizCharacter(char))
  }

  const questions: QuizQuestion[] = []

  for (let tier = 1; tier <= 5; tier++) {
    const pool = shuffleArray(buckets.get(tier) ?? [])

    // If this tier has < 4 characters, borrow from adjacent tiers
    if (pool.length < 4) {
      const adjacent =
        tier < 5 ? (buckets.get(tier + 1) ?? []) : (buckets.get(tier - 1) ?? [])
      const needed = 4 - pool.length
      const borrowed = shuffleArray(adjacent).slice(0, needed)
      pool.push(...borrowed)
    }

    if (pool.length < 4) return null // not enough characters

    // Try to find a correct character whose image loads
    let correctChar: QuizCharacter | null = null
    let imageUrl = ''

    for (const candidate of pool) {
      const url = getCharacterImageUrl(candidate.id)
      const loaded = await preloadImage(url)
      if (loaded) {
        correctChar = candidate
        imageUrl = url
        break
      }
    }

    if (!correctChar) return null // no valid images in this tier

    // Pick 3 wrong options from the same pool (excluding correct answer)
    const wrongOptions = pool
      .filter((c) => c.id !== correctChar!.id)
      .slice(0, 3)

    if (wrongOptions.length < 3) return null

    const options = shuffleArray([correctChar, ...wrongOptions])

    questions.push({
      correctCharacter: correctChar,
      options,
      tier,
      imageUrl,
    })
  }

  return questions
}

/** Get a display-friendly short name for share text */
export function getShortName(name: string): string {
  // Character IDs use underscores, but names use spaces
  // For common patterns like "Monkey D. Luffy", take the last word
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  // Return last part (surname/given name) for brevity
  return parts[parts.length - 1]
}

/** Calculate points for a correct answer */
export function calculatePoints(timeRemaining: number): number {
  if (timeRemaining <= 0) return 0
  return Math.round(1000 * (timeRemaining / 10))
}

/** Get score rating label */
export function getScoreRating(score: number): {
  label: string
  characterId: string | null
} {
  if (score === 5000)
    return { label: 'Pirate King!', characterId: 'Gol_D._Roger' }
  if (score >= 4000) return { label: 'Yonko Level!', characterId: null }
  if (score >= 3000) return { label: 'Shichibukai!', characterId: null }
  if (score >= 2000) return { label: 'Supernova!', characterId: null }
  if (score >= 1000) return { label: 'Grand Line Rookie', characterId: null }
  return { label: 'Gaimon Level!', characterId: 'Gaimon' }
}
