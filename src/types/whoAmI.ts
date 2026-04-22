export interface WhoAmIHint {
  label: string
  value: string
  type: 'text' | 'image'
}

export type WhoAmIDifficulty = 'easy' | 'moderate' | 'hard'

export interface WhoAmICharacter {
  id: string
  name: string
  imageUrl: string
  hints: WhoAmIHint[]
  bio: string | null
  difficulty: WhoAmIDifficulty
}

export interface WhoAmIRoundResult {
  character: WhoAmICharacter
  guessedCorrectly: boolean
  hintsUsed: number
  pointsEarned: number
  guessedName: string | null
}
