import { supabase } from '../supabase'
import { logger } from '../../utils/logger'
import { Character } from '../../types/character'
import { Arc, Saga } from '../../types/arc'
import { Chapter } from '../../types/chapter'

// ── Raw data loader ─────────────────────────────────────────────────────────

export interface InsightsRawData {
  characters: Character[]
  arcs: Arc[]
  sagas: Saga[]
  chapters: (Chapter & { date: string | null; num_page: number | null })[]
}

export async function fetchInsightsRawData(): Promise<InsightsRawData> {
  if (!supabase) {
    logger.error('Supabase client not initialized')
    return { characters: [], arcs: [], sagas: [], chapters: [] }
  }

  const [charRes, arcRes, sagaRes, chapterRes] = await Promise.all([
    supabase.from('character').select('*').order('name'),
    supabase
      .from('arc')
      .select('*')
      .order('start_chapter', { ascending: true }),
    supabase
      .from('saga')
      .select('*')
      .order('start_chapter', { ascending: true }),
    supabase
      .from('chapter')
      .select('number, volume, title, num_page, date, jump')
      .order('number', { ascending: true }),
  ])

  // Match arcs to sagas
  const sagas: Saga[] = sagaRes.data || []
  const arcs: Arc[] = (arcRes.data || []).map((arc) => {
    const saga = arc.saga_id
      ? sagas.find((s) => s.saga_id === arc.saga_id)
      : sagas.find(
          (s) =>
            arc.start_chapter >= s.start_chapter &&
            arc.start_chapter <= s.end_chapter
        )
    return { ...arc, saga: saga ? { title: saga.title } : undefined }
  })

  return {
    characters: charRes.data || [],
    arcs,
    sagas,
    chapters: chapterRes.data || [],
  }
}

// ── #1 Characters per Chapter Over Time ─────────────────────────────────────

export interface ChapterComplexityPoint {
  chapter: number
  characters: number
  rollingAvg: number
  trend: number
  arc: string
}

export function computeChapterComplexity(
  characters: Character[],
  arcs: Arc[],
  totalChapters: number
): ChapterComplexityPoint[] {
  // Count characters per chapter
  const chapterCounts = new Map<number, number>()
  for (const c of characters) {
    if (!c.chapter_list) continue
    for (const ch of c.chapter_list) {
      chapterCounts.set(ch, (chapterCounts.get(ch) || 0) + 1)
    }
  }

  // Build raw data points
  const raw: { chapter: number; characters: number; arc: string }[] = []
  for (let ch = 1; ch <= totalChapters; ch++) {
    const count = chapterCounts.get(ch) || 0
    if (count === 0) continue
    const arc =
      arcs.find((a) => ch >= a.start_chapter && ch <= a.end_chapter)?.title ||
      ''
    raw.push({ chapter: ch, characters: count, arc })
  }

  // Linear regression for trendline
  const n = raw.length
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0
  for (const p of raw) {
    sumX += p.chapter
    sumY += p.characters
    sumXY += p.chapter * p.characters
    sumX2 += p.chapter * p.chapter
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Compute rolling average (window of 20 chapters) + trendline
  const WINDOW = 20
  return raw.map((point, i) => {
    const start = Math.max(0, i - Math.floor(WINDOW / 2))
    const end = Math.min(raw.length, i + Math.ceil(WINDOW / 2))
    const slice = raw.slice(start, end)
    const avg =
      Math.round(
        (slice.reduce((s, p) => s + p.characters, 0) / slice.length) * 10
      ) / 10
    const trend = Math.round((slope * point.chapter + intercept) * 10) / 10
    return { ...point, rollingAvg: avg, trend }
  })
}

// ── #2 Bounty vs Appearance Count ───────────────────────────────────────────

export interface BountyVsAppearance {
  id: string
  name: string
  bounty: number
  appearances: number
  status: string
}

export function computeBountyVsAppearance(
  characters: Character[]
): BountyVsAppearance[] {
  return characters
    .filter(
      (c) =>
        c.bounty && c.bounty > 0 && c.appearance_count && c.appearance_count > 0
    )
    .map((c) => ({
      id: c.id,
      name: c.name || 'Unknown',
      bounty: c.bounty!,
      appearances: c.appearance_count!,
      status: c.status || 'Unknown',
    }))
    .sort((a, b) => b.bounty - a.bounty)
}

// ── #3 Top Bounty Jumps (parse bounties string for history) ─────────────────

export interface BountyJump {
  name: string
  firstBounty: number
  lastBounty: number
  jump: number
  multiplier: number
}

export function computeTopBountyJumps(characters: Character[]): BountyJump[] {
  const results: BountyJump[] = []

  for (const c of characters) {
    if (!c.bounties) continue
    // bounties field contains bounty history, e.g. "30,000,000;100,000,000;..."
    // or "฿30,000,000 → ฿100,000,000" or similar formats
    const numbers = extractBountyNumbers(c.bounties)
    if (numbers.length < 2) continue

    // bounties field lists highest first, so reverse to get chronological order
    const chronological = [...numbers].reverse()
    const first = chronological[0]
    const last = chronological[chronological.length - 1]
    if (first <= 0 || last <= first) continue

    results.push({
      name: c.name || 'Unknown',
      firstBounty: first,
      lastBounty: last,
      jump: last - first,
      multiplier: Math.round((last / first) * 10) / 10,
    })
  }

  return results.sort((a, b) => b.jump - a.jump).slice(0, 10)
}

function extractBountyNumbers(bounties: string): number[] {
  // Extract all numbers from the bounties string
  const matches = bounties.match(/[\d,]+/g)
  if (!matches) return []

  return matches
    .map((m) => parseInt(m.replace(/,/g, ''), 10))
    .filter((n) => !isNaN(n) && n > 0)
}

// ── #4 Dead or Alive Ratio by Region ────────────────────────────────────────

export interface RegionStatusData {
  region: string
  alive: number
  deceased: number
  unknown: number
  total: number
  deathRate: number
}

export function computeRegionStatus(
  characters: Character[]
): RegionStatusData[] {
  const regionMap = new Map<
    string,
    { alive: number; deceased: number; unknown: number }
  >()

  for (const c of characters) {
    if (!c.origin_region) continue
    const entry = regionMap.get(c.origin_region) || {
      alive: 0,
      deceased: 0,
      unknown: 0,
    }
    if (c.status === 'Alive') entry.alive++
    else if (c.status === 'Deceased') entry.deceased++
    else entry.unknown++
    regionMap.set(c.origin_region, entry)
  }

  return Array.from(regionMap.entries())
    .map(([region, counts]) => {
      const total = counts.alive + counts.deceased + counts.unknown
      return {
        region,
        ...counts,
        total,
        deathRate:
          total > 0 ? Math.round((counts.deceased / total) * 1000) / 10 : 0,
      }
    })
    .filter((r) => r.total >= 5)
    .sort((a, b) => b.deathRate - a.deathRate)
}

// ── #5 Most Loyal Characters ────────────────────────────────────────────────

export interface LoyalCharacter {
  name: string
  appearances: number
  span: number
  density: number // appearances / span
  firstChapter: number
  lastChapter: number
}

export function computeMostLoyal(characters: Character[]): LoyalCharacter[] {
  return characters
    .filter(
      (c) =>
        c.appearance_count &&
        c.appearance_count > 10 &&
        c.first_appearance !== null &&
        c.last_appearance !== null &&
        c.last_appearance! > c.first_appearance!
    )
    .map((c) => {
      const span = c.last_appearance! - c.first_appearance! + 1
      return {
        name: c.name || 'Unknown',
        appearances: c.appearance_count!,
        span,
        density: Math.round((c.appearance_count! / span) * 1000) / 10,
        firstChapter: c.first_appearance!,
        lastChapter: c.last_appearance!,
      }
    })
    .sort((a, b) => b.density - a.density)
    .slice(0, 15)
}

// ── #6 One-Arc Wonders vs Recurring Cast ────────────────────────────────────

export interface ArcCountDistribution {
  arcCount: string
  characterCount: number
}

export function computeArcCountDistribution(
  characters: Character[]
): ArcCountDistribution[] {
  const countMap = new Map<number, number>()

  for (const c of characters) {
    const arcCount = c.arc_list?.length || 0
    if (arcCount === 0) continue
    countMap.set(arcCount, (countMap.get(arcCount) || 0) + 1)
  }

  const maxArcs = Math.max(...Array.from(countMap.keys()))
  const result: ArcCountDistribution[] = []

  for (let i = 1; i <= Math.min(maxArcs, 10); i++) {
    result.push({
      arcCount: i === 1 ? '1 arc' : `${i} arcs`,
      characterCount: countMap.get(i) || 0,
    })
  }

  // Group 11+ together
  let elevenPlus = 0
  for (let i = 11; i <= maxArcs; i++) {
    elevenPlus += countMap.get(i) || 0
  }
  if (elevenPlus > 0) {
    result.push({ arcCount: '11+ arcs', characterCount: elevenPlus })
  }

  return result
}

// ── #7 Character Introduction Rate per Arc ──────────────────────────────────

export interface ArcIntroRate {
  arc: string
  newCharacters: number
  saga: string
  arcOrder: number
}

export function computeArcIntroRate(
  characters: Character[],
  arcs: Arc[]
): ArcIntroRate[] {
  return arcs.map((arc) => {
    const newChars = characters.filter(
      (c) =>
        c.first_appearance !== null &&
        c.first_appearance >= arc.start_chapter &&
        c.first_appearance <= arc.end_chapter
    ).length

    return {
      arc: arc.title,
      newCharacters: newChars,
      saga: arc.saga?.title || 'Unknown',
      arcOrder: arc.start_chapter,
    }
  })
}

// ── #8 Gap Analysis ─────────────────────────────────────────────────────────

export interface CharacterGap {
  name: string
  gapStart: number
  gapEnd: number
  gapLength: number
  totalAppearances: number
}

export function computeLongestGaps(characters: Character[]): CharacterGap[] {
  const results: CharacterGap[] = []

  for (const c of characters) {
    if (!c.chapter_list || c.chapter_list.length < 2) continue

    const sorted = [...c.chapter_list].sort((a, b) => a - b)
    let maxGap = 0
    let gapStart = 0
    let gapEnd = 0

    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i] - sorted[i - 1]
      if (gap > maxGap) {
        maxGap = gap
        gapStart = sorted[i - 1]
        gapEnd = sorted[i]
      }
    }

    if (maxGap > 50) {
      results.push({
        name: c.name || 'Unknown',
        gapStart,
        gapEnd,
        gapLength: maxGap,
        totalAppearances: c.appearance_count || sorted.length,
      })
    }
  }

  return results.sort((a, b) => b.gapLength - a.gapLength).slice(0, 15)
}

// ── #9 Arc Length Trend ─────────────────────────────────────────────────────

export interface ArcLength {
  arc: string
  chapters: number
  saga: string
  arcOrder: number
}

export function computeArcLengths(arcs: Arc[]): ArcLength[] {
  return arcs.map((arc) => ({
    arc: arc.title,
    chapters: arc.end_chapter - arc.start_chapter + 1,
    saga: arc.saga?.title || 'Unknown',
    arcOrder: arc.start_chapter,
  }))
}

// ── #10 Pages per Arc ───────────────────────────────────────────────────────

export interface ArcPages {
  arc: string
  totalPages: number
  chapterCount: number
  avgPagesPerChapter: number
  saga: string
}

export function computePagesPerArc(
  arcs: Arc[],
  chapters: { number: number; num_page: number | null }[]
): ArcPages[] {
  return arcs
    .map((arc) => {
      const arcChapters = chapters.filter(
        (ch) => ch.number >= arc.start_chapter && ch.number <= arc.end_chapter
      )
      const totalPages = arcChapters.reduce(
        (sum, ch) => sum + (ch.num_page || 0),
        0
      )
      const chapterCount = arcChapters.length
      return {
        arc: arc.title,
        totalPages,
        chapterCount,
        avgPagesPerChapter:
          chapterCount > 0
            ? Math.round((totalPages / chapterCount) * 10) / 10
            : 0,
        saga: arc.saga?.title || 'Unknown',
      }
    })
    .filter((a) => a.totalPages > 0)
}

// ── #11 Saga Pacing Comparison ──────────────────────────────────────────────

export interface SagaPacing {
  saga: string
  totalChapters: number
  totalPages: number
  characterCount: number
  newCharacters: number
  arcCount: number
  density: number // characters per chapter
}

export function computeSagaPacing(
  sagas: Saga[],
  arcs: Arc[],
  characters: Character[],
  chapters: { number: number; num_page: number | null }[]
): SagaPacing[] {
  return sagas.map((saga) => {
    const sagaArcs = arcs.filter(
      (a) =>
        a.start_chapter >= saga.start_chapter &&
        a.start_chapter <= saga.end_chapter
    )
    const sagaChapters = chapters.filter(
      (ch) => ch.number >= saga.start_chapter && ch.number <= saga.end_chapter
    )
    const totalPages = sagaChapters.reduce(
      (sum, ch) => sum + (ch.num_page || 0),
      0
    )
    const totalChapters = saga.end_chapter - saga.start_chapter + 1

    // Characters active in this saga
    const activeChars = characters.filter(
      (c) =>
        c.chapter_list &&
        c.chapter_list.some(
          (ch) => ch >= saga.start_chapter && ch <= saga.end_chapter
        )
    ).length

    // New characters introduced in this saga
    const newChars = characters.filter(
      (c) =>
        c.first_appearance !== null &&
        c.first_appearance >= saga.start_chapter &&
        c.first_appearance <= saga.end_chapter
    ).length

    return {
      saga: saga.title,
      totalChapters,
      totalPages,
      characterCount: activeChars,
      newCharacters: newChars,
      arcCount: sagaArcs.length,
      density:
        totalChapters > 0
          ? Math.round((activeChars / totalChapters) * 10) / 10
          : 0,
    }
  })
}

// ── #12 Chapter Release Cadence (chapters per year) ─────────────────────────

export interface YearlyRelease {
  year: number
  chapters: number
  breaks: number // estimated: ~48 issues/year minus chapters
}

export function computeYearlyReleases(
  chapters: { number: number; date: string | null }[]
): YearlyRelease[] {
  const yearMap = new Map<number, number>()

  for (const ch of chapters) {
    if (!ch.date) continue
    const year = new Date(ch.date).getFullYear()
    if (isNaN(year)) continue
    yearMap.set(year, (yearMap.get(year) || 0) + 1)
  }

  return Array.from(yearMap.entries())
    .map(([year, count]) => ({
      year,
      chapters: count,
      breaks: Math.max(0, 48 - count), // roughly 48 issues per year in Jump
    }))
    .sort((a, b) => a.year - b.year)
}

// ── #13 Blood Type Distribution ─────────────────────────────────────────────

export interface BloodTypeComparison {
  bloodType: string
  opPercent: number
  japanPercent: number
  count: number
}

export function computeBloodTypeComparison(
  characters: Character[]
): BloodTypeComparison[] {
  // Real-world Japanese population blood type distribution
  const japanDistribution: Record<string, number> = {
    A: 40,
    B: 20,
    O: 30,
    AB: 10,
  }

  const bloodTypeMap = new Map<string, number>()
  let total = 0
  for (const c of characters) {
    if (!c.blood_type_group) continue
    const bt = c.blood_type_group.toUpperCase()
    if (['A', 'B', 'O', 'AB'].includes(bt)) {
      bloodTypeMap.set(bt, (bloodTypeMap.get(bt) || 0) + 1)
      total++
    }
  }

  if (total === 0) return []

  return ['A', 'B', 'O', 'AB'].map((bt) => ({
    bloodType: bt,
    opPercent: Math.round(((bloodTypeMap.get(bt) || 0) / total) * 1000) / 10,
    japanPercent: japanDistribution[bt],
    count: bloodTypeMap.get(bt) || 0,
  }))
}

// ── #14 Birthday Heatmap ────────────────────────────────────────────────────

export interface BirthdayMonth {
  month: string
  count: number
  monthNum: number
}

export function computeBirthdayDistribution(
  characters: Character[]
): BirthdayMonth[] {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const monthCounts = new Array(12).fill(0)

  for (const c of characters) {
    if (!c.birth_date) continue
    const month = parseMonth(c.birth_date)
    if (month !== null) {
      monthCounts[month]++
    }
  }

  return monthNames.map((name, i) => ({
    month: name,
    count: monthCounts[i],
    monthNum: i + 1,
  }))
}

function parseMonth(birthDate: string): number | null {
  const monthNames = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ]
  const lower = birthDate.trim().toLowerCase()
  for (let i = 0; i < monthNames.length; i++) {
    if (lower.startsWith(monthNames[i])) return i
  }
  const m = birthDate.match(/^(\d{1,2})[-/]/)
  if (m) {
    const n = parseInt(m[1], 10)
    if (n >= 1 && n <= 12) return n - 1
  }
  return null
}

// ── #15 Origin Region Treemap ───────────────────────────────────────────────

export interface RegionCount {
  region: string
  count: number
}

export function computeRegionCounts(characters: Character[]): RegionCount[] {
  const counts = new Map<string, number>()
  for (const c of characters) {
    if (!c.origin_region) continue
    counts.set(c.origin_region, (counts.get(c.origin_region) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
}

// ── #16 Age Distribution by Status ──────────────────────────────────────────

export interface AgeStatusBucket {
  ageRange: string
  alive: number
  deceased: number
  unknown: number
}

export function computeAgeDistribution(
  characters: Character[]
): AgeStatusBucket[] {
  const ranges = [
    { min: 0, max: 10, label: '0-10' },
    { min: 10, max: 20, label: '10-19' },
    { min: 20, max: 30, label: '20-29' },
    { min: 30, max: 40, label: '30-39' },
    { min: 40, max: 50, label: '40-49' },
    { min: 50, max: 60, label: '50-59' },
    { min: 60, max: 80, label: '60-79' },
    { min: 80, max: 100, label: '80-99' },
    { min: 100, max: 200, label: '100+' },
  ]

  return ranges.map((range) => {
    const inRange = characters.filter(
      (c) => c.age !== null && c.age >= range.min && c.age < range.max
    )
    return {
      ageRange: range.label,
      alive: inRange.filter((c) => c.status === 'Alive').length,
      deceased: inRange.filter((c) => c.status === 'Deceased').length,
      unknown: inRange.filter(
        (c) => c.status !== 'Alive' && c.status !== 'Deceased'
      ).length,
    }
  })
}

// ── #17 Cover Page Stars ────────────────────────────────────────────────────

export interface CoverStar {
  name: string
  coverAppearances: number
  mainAppearances: number
  ratio: number // cover / main
}

export function computeCoverStars(characters: Character[]): CoverStar[] {
  return characters
    .filter((c) => c.cover_appearance_count && c.cover_appearance_count > 0)
    .map((c) => ({
      name: c.name || 'Unknown',
      coverAppearances: c.cover_appearance_count!,
      mainAppearances: c.appearance_count || 0,
      ratio:
        c.appearance_count && c.appearance_count > 0
          ? Math.round(
              (c.cover_appearance_count! / c.appearance_count) * 1000
            ) / 10
          : 0,
    }))
    .sort((a, b) => b.coverAppearances - a.coverAppearances)
    .slice(0, 20)
}

// ── #18 Cover vs Main Appearances ───────────────────────────────────────────

export interface CoverVsMain {
  name: string
  cover: number
  main: number
}

export function computeCoverVsMain(characters: Character[]): CoverVsMain[] {
  return characters
    .filter(
      (c) =>
        c.cover_appearance_count &&
        c.cover_appearance_count > 0 &&
        c.appearance_count &&
        c.appearance_count > 0
    )
    .map((c) => ({
      name: c.name || 'Unknown',
      cover: c.cover_appearance_count!,
      main: c.appearance_count!,
    }))
}

// ── #19 Network Density per Arc (simplified: unique characters per arc) ─────

export interface ArcDensity {
  arc: string
  uniqueCharacters: number
  chapters: number
  charsPerChapter: number
}

export function computeArcDensity(
  characters: Character[],
  arcs: Arc[]
): ArcDensity[] {
  return arcs.map((arc) => {
    const uniqueChars = characters.filter(
      (c) =>
        c.chapter_list &&
        c.chapter_list.some(
          (ch) => ch >= arc.start_chapter && ch <= arc.end_chapter
        )
    ).length

    const chapters = arc.end_chapter - arc.start_chapter + 1
    return {
      arc: arc.title,
      uniqueCharacters: uniqueChars,
      chapters,
      charsPerChapter:
        chapters > 0 ? Math.round((uniqueChars / chapters) * 10) / 10 : 0,
    }
  })
}

// ── #20 Data Completeness Summary ───────────────────────────────────────────

export interface CompletenessField {
  field: string
  filled: number
  total: number
  percent: number
}

export function computeCompleteness(
  characters: Character[]
): CompletenessField[] {
  const total = characters.length
  if (total === 0) return []

  const fields: { key: keyof Character; label: string }[] = [
    { key: 'bounty', label: 'Bounty' },
    { key: 'age', label: 'Age' },
    { key: 'blood_type_group', label: 'Blood Type' },
    { key: 'origin_region', label: 'Origin Region' },
    { key: 'birth_date', label: 'Birthday' },
    { key: 'status', label: 'Status' },
    { key: 'first_appearance', label: 'First Appearance' },
    { key: 'chapter_list', label: 'Chapter List' },
    { key: 'arc_list', label: 'Arc List' },
  ]

  return fields.map(({ key, label }) => {
    const filled = characters.filter((c) => {
      const val = c[key]
      if (val === null || val === undefined) return false
      if (Array.isArray(val)) return val.length > 0
      return true
    }).length
    return {
      field: label,
      filled,
      total,
      percent: Math.round((filled / total) * 1000) / 10,
    }
  })
}
