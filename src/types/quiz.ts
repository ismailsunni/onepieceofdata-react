export interface QuizCharacter {
  id: string
  name: string
  appearance_count: number
  bounty: number | null
  bio: string | null
}

export interface QuizQuestion {
  correctCharacter: QuizCharacter
  options: QuizCharacter[] // 4 characters, one is correct
  tier: number // 1-5
  imageUrl: string
}

export interface QuizAnswer {
  questionIndex: number
  selectedCharacterId: string | null // null if time ran out
  correctCharacter: QuizCharacter
  isCorrect: boolean
  timeRemaining: number // seconds left when answered
  pointsEarned: number
}
