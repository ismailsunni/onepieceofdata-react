import type { Character } from '../types/character'
import type { Arc } from '../types/arc'
import type {
  ArcOption,
  ArcQuizCharacter,
  ArcQuizMode,
  ArcQuizQuestion,
} from '../types/arcQuiz'
import { getCharacterImageUrl, preloadImage } from './quizService'

const QUESTION_COUNT = 5

/** Chapter mode: distance (in chapters) at which a guess scores zero. */
export const CHAPTER_TOLERANCE = 100

export const ARC_QUIZ_MODES: {
  id: ArcQuizMode
  label: string
  tagline: string
  time: number // seconds per question
}[] = [
  {
    id: 'options',
    label: '4 Options',
    tagline: 'Pick the arc from four choices',
    time: 10,
  },
  {
    id: 'search',
    label: 'All Arcs',
    tagline: 'Search the full list of arcs',
    time: 15,
  },
  {
    id: 'chapter',
    label: 'Chapter №',
    tagline: 'Type the chapter — closer earns more',
    time: 20,
  },
]

export function getModeTime(mode: ArcQuizMode): number {
  return ARC_QUIZ_MODES.find((m) => m.id === mode)?.time ?? 10
}

/** Speed-based points for arc modes: max 1000, scaled by time remaining. */
export function speedPoints(timeRemaining: number, maxTime: number): number {
  if (timeRemaining <= 0) return 0
  return Math.round(1000 * (timeRemaining / maxTime))
}

/** Proximity-based points for chapter mode: max 1000, decaying with distance. */
export function chapterPoints(distance: number): number {
  return Math.round(1000 * Math.max(0, 1 - distance / CHAPTER_TOLERANCE))
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** A one-chapter character: appears in exactly one distinct chapter, and has a name. */
function isOneChapterCharacter(char: Character): boolean {
  if (!char.name) return false
  const chapters = char.chapter_list
  if (!chapters || chapters.length === 0) return false
  return new Set(chapters).size === 1
}

/** Resolve the arc a character's single chapter belongs to. */
function resolveArc(
  char: Character,
  chapter: number,
  arcMap: Map<string, Arc>,
  arcs: Arc[]
): Arc | null {
  const listed = char.arc_list?.find((id) => arcMap.has(id))
  if (listed) return arcMap.get(listed)!
  // Fallback: match by chapter range
  return (
    arcs.find((a) => chapter >= a.start_chapter && chapter <= a.end_chapter) ??
    null
  )
}

function toOption(arc: Arc): ArcOption {
  return { arc_id: arc.arc_id, title: arc.title }
}

/**
 * Generate 5 quiz questions: a one-chapter character with its arc and 4 arc
 * options. The same questions work for all modes (options / search / chapter).
 * Returns null if there aren't enough characters/arcs to build the quiz.
 */
export async function generateArcQuizQuestions(
  characters: Character[],
  arcs: Arc[]
): Promise<ArcQuizQuestion[] | null> {
  if (arcs.length < 4) return null

  const arcMap = new Map(arcs.map((a) => [a.arc_id, a]))
  const eligible = shuffleArray(characters.filter(isOneChapterCharacter))

  const questions: ArcQuizQuestion[] = []

  for (const char of eligible) {
    if (questions.length >= QUESTION_COUNT) break

    const chapter = char.chapter_list![0]
    const correctArc = resolveArc(char, chapter, arcMap, arcs)
    if (!correctArc) continue

    const url = getCharacterImageUrl(char.id)
    if (!(await preloadImage(url))) continue

    const wrongArcs = shuffleArray(
      arcs.filter((a) => a.arc_id !== correctArc.arc_id)
    ).slice(0, 3)
    if (wrongArcs.length < 3) return null

    const options = shuffleArray([correctArc, ...wrongArcs].map(toOption))

    const character: ArcQuizCharacter = {
      id: char.id,
      name: char.name!,
      bio: char.bio,
      chapter,
    }

    questions.push({
      character,
      correctArc: toOption(correctArc),
      correctArcStart: correctArc.start_chapter,
      correctArcEnd: correctArc.end_chapter,
      options,
      imageUrl: url,
    })
  }

  return questions.length === QUESTION_COUNT ? questions : null
}
