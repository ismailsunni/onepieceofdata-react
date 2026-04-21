export interface WhoAmIHint {
  label: string
  value: string
  type: 'text' | 'image'
}

export interface WhoAmICharacter {
  id: string
  name: string
  imageUrl: string
  hints: WhoAmIHint[]
  bio: string | null
}

export interface WhoAmIRoundResult {
  character: WhoAmICharacter
  guessedCorrectly: boolean
  hintsUsed: number
  pointsEarned: number
  guessedName: string | null
}
