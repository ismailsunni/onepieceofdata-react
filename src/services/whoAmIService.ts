import type { Character } from '../types/character'
import type { Arc } from '../types/arc'
import type { CharacterAffiliation } from '../types/affiliation'
import type { CharacterDevilFruit } from '../types/devilFruit'
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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function parseBirthMonth(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null
  const lower = birthDate.trim().toLowerCase()
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (lower.startsWith(MONTH_NAMES[i].toLowerCase())) return MONTH_NAMES[i]
  }
  const m = birthDate.match(/^(\d{1,2})[-/]/)
  if (m) {
    const n = parseInt(m[1], 10)
    if (n >= 1 && n <= 12) return MONTH_NAMES[n - 1]
  }
  return null
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
  arcMap: Map<string, Arc>,
  affiliationMap: Map<string, CharacterAffiliation[]>,
  devilFruitMap: Map<string, CharacterDevilFruit[]>
): WhoAmIHint[] {
  const hints: WhoAmIHint[] = []

  // Hint 1: Total appearances + top arcs
  const chapterList = char.chapter_list ?? []
  const totalAppearances = char.appearance_count ?? chapterList.length
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

  const appearancePrefix = `Appeared in ${totalAppearances} chapter${
    totalAppearances === 1 ? '' : 's'
  }`

  if (arcCounts.size > 0) {
    const topArcs = [...arcCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => {
        const name = arcMap.get(id)?.title ?? id
        const pct =
          totalAppearances > 0
            ? Math.round((count / totalAppearances) * 100)
            : 0
        return `${name} Arc (${pct}%)`
      })
    hints.push({
      label: 'Appearances & Top Arcs',
      value: `${appearancePrefix}. Most seen in: ${topArcs.join(', ')}`,
      type: 'text',
    })
  } else {
    const arcNames = (char.arc_list ?? [])
      .map((id) => arcMap.get(id)?.title)
      .filter(Boolean) as string[]
    hints.push({
      label: 'Appearances & Arcs',
      value:
        arcNames.length > 0
          ? `${appearancePrefix} across ${arcNames.length} arc(s)`
          : `${appearancePrefix}. Arc breakdown unavailable`,
      type: 'text',
    })
  }

  // Hint 2: Status + powers
  const status = char.status ?? 'Unknown'
  const fruits = devilFruitMap.get(char.id) ?? []
  const hakiTypes: string[] = []
  if (char.haki_observation) hakiTypes.push('Observation')
  if (char.haki_armament) hakiTypes.push('Armament')
  if (char.haki_conqueror) hakiTypes.push("Conqueror's")

  const describeFruit = (f: CharacterDevilFruit): string => {
    const parts: string[] = []
    if (f.fruit_sub_type) parts.push(f.fruit_sub_type)
    if (f.fruit_type) parts.push(f.fruit_type)
    const typeLabel = parts.length > 0 ? parts.join(' ') : 'unknown-type'
    const suffix = f.is_artificial ? ' (artificial)' : ''
    return `${typeLabel}${suffix}`
  }

  let fruitText = ''
  if (fruits.length === 1) {
    fruitText = `Wields a ${describeFruit(fruits[0])} Devil Fruit`
  } else if (fruits.length > 1) {
    const descriptions = fruits.map(describeFruit)
    fruitText = `Wields ${fruits.length} Devil Fruits (${descriptions.join('; ')})`
  } else {
    fruitText = 'No known Devil Fruit'
  }

  const hakiText =
    hakiTypes.length > 0 ? `Haki: ${hakiTypes.join(', ')}` : 'No known Haki'

  hints.push({
    label: 'Status & Powers',
    value: `Status: ${status}. ${fruitText}. ${hakiText}.`,
    type: 'text',
  })

  // Hint 3: Affiliation + birth month (with fallback to origin)
  const affiliations = affiliationMap.get(char.id) ?? []
  const currentAffiliations = affiliations.filter((a) =>
    [
      'current',
      'temporary',
      'undercover',
      'double agent',
      'espionage',
      'secret',
    ].includes(a.status.toLowerCase())
  )
  const displayAffiliations =
    currentAffiliations.length > 0 ? currentAffiliations : affiliations
  const birthMonth = parseBirthMonth(char.birth_date ?? char.birth)
  const birthText = birthMonth ? ` Born in ${birthMonth}.` : ''

  if (displayAffiliations.length > 0) {
    const names = [
      ...new Set(displayAffiliations.map((a) => a.group_name)),
    ].slice(0, 3)
    hints.push({
      label: 'Affiliation',
      value: `Affiliated with: ${names.join(', ')}.${birthText}`,
      type: 'text',
    })
  } else if (char.origin) {
    hints.push({
      label: 'Origin',
      value: `Origin: ${char.origin}.${birthText}`,
      type: 'text',
    })
  } else if (birthMonth) {
    hints.push({
      label: 'Birth',
      value: `Born in ${birthMonth}. No known affiliation.`,
      type: 'text',
    })
  } else {
    hints.push({
      label: 'Affiliation',
      value: 'No known affiliation',
      type: 'text',
    })
  }

  // Hint 4: Masked name pattern + bounty
  const maskedName = char
    .name!.split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part
      if (part.length <= 1) return part
      return part[0] + '*'.repeat(part.length - 1)
    })
    .join('')
  const bountyText =
    char.bounty && char.bounty > 0
      ? `Bounty: ${formatBounty(char.bounty)}`
      : 'Has no known bounty'
  hints.push({
    label: 'Name & Bounty',
    value: `Name: ${maskedName}. ${bountyText}`,
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
  arcMap: Map<string, Arc>,
  affiliationMap: Map<string, CharacterAffiliation[]>,
  devilFruitMap: Map<string, CharacterDevilFruit[]>
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

    const hints = generateHints(char, arcMap, affiliationMap, devilFruitMap)
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
