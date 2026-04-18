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
}

export interface WhoAmIRoundResult {
  character: WhoAmICharacter
  guessedCorrectly: boolean
  hintsUsed: number
  pointsEarned: number
  guessedName: string | null
}
