export type ArcQuizMode = 'options' | 'search' | 'chapter'

export interface ArcQuizCharacter {
  id: string
  name: string
  bio: string | null
  chapter: number // the single chapter the character appears in
}

export interface ArcOption {
  arc_id: string
  title: string
}

export interface ArcQuizQuestion {
  character: ArcQuizCharacter
  correctArc: ArcOption
  correctArcStart: number // correct arc's first chapter
  correctArcEnd: number // correct arc's last chapter
  options: ArcOption[] // 4 arcs, one is correct (used in "options" mode)
  imageUrl: string
}

export interface ArcQuizAnswer {
  questionIndex: number
  character: ArcQuizCharacter
  correctArc: ArcOption
  mode: ArcQuizMode
  selectedArcId: string | null // arc modes; null if skipped/timed out
  selectedChapter: number | null // chapter mode; null if timed out
  isCorrect: boolean
  distance: number | null // chapter mode: |guess - actual|
  timeRemaining: number
  pointsEarned: number
}
