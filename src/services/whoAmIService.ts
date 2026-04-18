import type { Character } from '../types/character'
import type { Arc } from '../types/arc'
import type { WhoAmIHint, WhoAmICharacter } from '../types/whoAmI'
import { getCharacterImageUrl, preloadImage } from './quizService'

function isEligibleForWhoAmI(char: Character): boolean {
  if (!char.name) return false
  if (!char.saga_list || char.saga_list.length === 0) return false
  if (char.appearance_count === null || char.appearance_count === undefined)
    return false
  if (char.appearance_count < 5) return false
  return true
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function formatBounty(bounty: number): string {
  if (bounty >= 1_000_000_000) {
    const b = bounty / 1_000_000_000
    return `${Number.isInteger(b) ? b : b.toFixed(1)} billion`
  }
  if (bounty >= 1_000_000) {
    const m = bounty / 1_000_000
    return `${Number.isInteger(m) ? m : m.toFixed(1)} million`
  }
  return bounty.toLocaleString()
}

function generateHints(
  char: Character,
  arcMap: Map<string, Arc>
): WhoAmIHint[] {
  const hints: WhoAmIHint[] = []

  // Hint 1: Top arc by chapter count (min 2 chapters in that arc)
  const chapterList = char.chapter_list ?? []
  const arcCounts = new Map<string, number>()
  for (const arcId of char.arc_list ?? []) {
    const arc = arcMap.get(arcId)
    if (!arc) continue
    const chaptersInArc = chapterList.filter(
      (ch) => ch >= arc.start_chapter && ch <= arc.end_chapter
    ).length
    if (chaptersInArc >= 2) {
      arcCounts.set(arcId, chaptersInArc)
    }
  }

  if (arcCounts.size > 0) {
    // Find the arc with the most chapter appearances
    let topArcId = ''
    let topCount = 0
    for (const [id, count] of arcCounts) {
      if (count > topCount) {
        topArcId = id
        topCount = count
      }
    }
    const topArcName = arcMap.get(topArcId)?.title ?? topArcId
    hints.push({
      label: 'Top Arc',
      value: `Most appeared in: ${topArcName} Arc (${topCount} chapters)`,
      type: 'text',
    })
  } else {
    // Fallback: just show arc count
    const arcNames = (char.arc_list ?? [])
      .map((id) => arcMap.get(id)?.title)
      .filter(Boolean) as string[]
    hints.push({
      label: 'Arc Appearances',
      value:
        arcNames.length > 0
          ? `Appears in ${arcNames.length} arc(s)`
          : 'Arc information unavailable',
      type: 'text',
    })
  }

  // Hint 2: Appearance count + status
  const count = char.appearance_count ?? 0
  const status = char.status ?? 'Unknown'
  hints.push({
    label: 'Appearances & Status',
    value: `Appeared in ${count} chapters. Status: ${status}`,
    type: 'text',
  })

  // Hint 3: Origin or first appearance arc
  if (char.origin) {
    hints.push({
      label: 'Origin',
      value: `Origin: ${char.origin}`,
      type: 'text',
    })
  } else if (
    char.first_appearance &&
    char.arc_list &&
    char.arc_list.length > 0
  ) {
    const firstArc = arcMap.get(char.arc_list[0])
    const arcName = firstArc?.title ?? char.arc_list[0]
    hints.push({
      label: 'First Appearance',
      value: `First appeared in Chapter ${char.first_appearance} (${arcName})`,
      type: 'text',
    })
  } else if (char.first_appearance) {
    hints.push({
      label: 'First Appearance',
      value: `First appeared in Chapter ${char.first_appearance}`,
      type: 'text',
    })
  } else {
    hints.push({
      label: 'Origin',
      value: 'Origin unknown',
      type: 'text',
    })
  }

  // Hint 4: First letter + bounty
  const firstLetter = char.name!.charAt(0).toUpperCase()
  const bountyText =
    char.bounty && char.bounty > 0
      ? `Bounty: ${formatBounty(char.bounty)}`
      : 'Has no known bounty'
  hints.push({
    label: 'Name & Bounty',
    value: `Name starts with "${firstLetter}". ${bountyText}`,
    type: 'text',
  })

  // Hint 5: Character image
  hints.push({
    label: 'Portrait',
    value: getCharacterImageUrl(char.id),
    type: 'image',
  })

  return hints
}

export async function generateWhoAmIRound(
  characters: Character[],
  arcMap: Map<string, Arc>
): Promise<WhoAmICharacter[] | null> {
  const eligible = characters.filter(isEligibleForWhoAmI)
  const shuffled = shuffleArray(eligible)

  const result: WhoAmICharacter[] = []
  let candidateIndex = 0

  const ROUNDS = 3
  while (result.length < ROUNDS && candidateIndex < shuffled.length) {
    const char = shuffled[candidateIndex]
    candidateIndex++

    const imageUrl = getCharacterImageUrl(char.id)
    const loaded = await preloadImage(imageUrl)
    if (!loaded) continue

    const hints = generateHints(char, arcMap)
    result.push({
      id: char.id,
      name: char.name!,
      imageUrl,
      hints,
    })
  }

  if (result.length < ROUNDS) return null
  return result
}

export function calculateWhoAmIPoints(hintIndex: number): number {
  return 5 - hintIndex
}

interface WhoAmIRating {
  label: string
}

const RANKS: { min: number; label: string }[] = [
  { min: 15, label: 'Pirate King!' },
  { min: 12, label: 'Yonko Level!' },
  { min: 9, label: 'Supernova!' },
  { min: 6, label: 'Grand Line Pirate!' },
  { min: 3, label: 'East Blue Rookie!' },
  { min: 1, label: 'Cabin Boy!' },
  { min: 0, label: "Foxy's Friend!" },
]

export function getWhoAmIRating(score: number): WhoAmIRating {
  for (const rank of RANKS) {
    if (score >= rank.min) {
      return { label: rank.label }
    }
  }
  return { label: "Foxy's Friend!" }
}
