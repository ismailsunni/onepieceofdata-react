import { supabase } from '../supabase'
import { logger } from '../../utils/logger'

/**
 * Chapter release data for calendar view
 */
export interface ChapterRelease {
  number: number
  jump: string | null
  date: string | null
  year: number | null
  issue: number | null
  issueEnd: number | null // For double issues like "37-38"
  arcId: string | null
  arcTitle: string | null
  sagaId: string | null
  sagaTitle: string | null
}

/**
 * Parse Jump issue number from various formats
 * Examples: "1997 Issue 34", "1997 Issue 37-38" (double issue), "2024 Issue 1"
 */
function parseJumpIssue(
  jump: string | null,
  date: string | null
): { year: number; issue: number; issueEnd: number | null } | null {
  if (!jump) return null

  // Try to parse issue number from jump field
  const jumpStr = jump.trim()

  // Check for format "YYYY Issue NN-NN" (double issue)
  const doubleIssueMatch = jumpStr.match(/^(\d{4})\s+Issue\s+(\d+)-(\d+)/)
  if (doubleIssueMatch) {
    return {
      year: parseInt(doubleIssueMatch[1]),
      issue: parseInt(doubleIssueMatch[2]),
      issueEnd: parseInt(doubleIssueMatch[3]),
    }
  }

  // Check for format "YYYY Issue NN" (single issue)
  const issueMatch = jumpStr.match(/^(\d{4})\s+Issue\s+(\d+)/)
  if (issueMatch) {
    return {
      year: parseInt(issueMatch[1]),
      issue: parseInt(issueMatch[2]),
      issueEnd: null,
    }
  }

  // Fallback: Extract year from date if available
  let year: number | null = null
  if (date) {
    try {
      year = new Date(date).getFullYear()
    } catch {
      logger.warn('Error parsing date:', date)
    }
  }

  // Check if it has year prefix (e.g., "1997-34" or "2024-01")
  const yearIssueMatch = jumpStr.match(/^(\d{4})[-/](\d+)/)
  if (yearIssueMatch) {
    return {
      year: parseInt(yearIssueMatch[1]),
      issue: parseInt(yearIssueMatch[2]),
      issueEnd: null,
    }
  }

  // Check for double issues like "34-35" or "1&2" - take the first number
  const oldDoubleIssueMatch = jumpStr.match(/^(\d+)[-&](\d+)/)
  if (oldDoubleIssueMatch) {
    return year
      ? {
          year,
          issue: parseInt(oldDoubleIssueMatch[1]),
          issueEnd: parseInt(oldDoubleIssueMatch[2]),
        }
      : null
  }

  // Check for simple number like "34"
  const simpleMatch = jumpStr.match(/^(\d+)$/)
  if (simpleMatch) {
    return year
      ? { year, issue: parseInt(simpleMatch[1]), issueEnd: null }
      : null
  }

  logger.warn('Could not parse Jump issue:', jump, 'with date:', date)
  return null
}

/**
 * Fetch chapter releases grouped by year and Jump issue
 */
export async function fetchChapterReleases(): Promise<ChapterRelease[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    // Fetch chapters, arcs, and sagas in parallel
    const [chaptersRes, arcsRes, sagasRes] = await Promise.all([
      supabase
        .from('chapter')
        .select('number, jump, date')
        .order('number', { ascending: true }),
      supabase
        .from('arc')
        .select('arc_id, title, start_chapter, end_chapter, saga_id'),
      supabase
        .from('saga')
        .select('saga_id, title, start_chapter, end_chapter'),
    ])

    if (chaptersRes.error) {
      logger.error('Error fetching chapters:', chaptersRes.error)
      return []
    }

    const chapters = chaptersRes.data || []
    const arcs = arcsRes.data || []
    const sagas = sagasRes.data || []

    // Parse and extract year and issue from jump field
    const releases: ChapterRelease[] = chapters.map((chapter) => {
      const parsed = parseJumpIssue(chapter.jump, chapter.date)

      // Find which arc this chapter belongs to
      const arc = arcs.find(
        (a) =>
          a.start_chapter !== null &&
          a.end_chapter !== null &&
          chapter.number >= a.start_chapter &&
          chapter.number <= a.end_chapter
      )

      // Find which saga this chapter belongs to
      const saga = sagas.find(
        (s) =>
          s.start_chapter !== null &&
          s.end_chapter !== null &&
          chapter.number >= s.start_chapter &&
          chapter.number <= s.end_chapter
      )

      return {
        number: chapter.number,
        jump: chapter.jump,
        date: chapter.date,
        year: parsed?.year || null,
        issue: parsed?.issue || null,
        issueEnd: parsed?.issueEnd || null,
        arcId: arc?.arc_id || null,
        arcTitle: arc?.title || null,
        sagaId: saga?.saga_id || null,
        sagaTitle: saga?.title || null,
      }
    })

    return releases
  } catch (error) {
    logger.error('Error in fetchChapterReleases:', error)
    return []
  }
}

/**
 * Fetch the chapter_list (sorted set of appearance chapter numbers) for a
 * single character, identified by their character ID. Used by the release
 * history calendar to color cells based on character appearance.
 */
export async function fetchCharacterChapterList(
  characterId: string
): Promise<number[]> {
  if (!supabase || !characterId) return []
  const { data, error } = await supabase
    .from('character')
    .select('chapter_list')
    .eq('id', characterId)
    .single()
  if (error) {
    logger.error('Error fetching character chapter_list:', error)
    return []
  }
  return data?.chapter_list || []
}

// ── Yearly publication statistics ───────────────────────────────────────────

export interface YearlyPublicationStat {
  year: number
  chapters: number
  breaks: number
  availableWeeks: number
  firstChapter: number | null
  lastChapter: number | null
}

/**
 * Compute per-year chapter and break counts from chapter release data.
 * Handles double issues, year transitions, and the conventional issue 53
 * exclusion. Used by both the Story Topic page and the embed.
 */
export function computeYearlyPublicationStats(
  releases: ChapterRelease[]
): YearlyPublicationStat[] {
  if (!releases || releases.length === 0) return []

  const sortedReleases = [...releases].sort((a, b) => a.number - b.number)
  const yearlyData = new Map<
    number,
    {
      chapters: number
      breaks: number
      firstIssue: number
      lastIssue: number
      issuesWithChapters: Set<number>
      firstChapter: number | null
      lastChapter: number | null
    }
  >()

  // Initialize all years and track first/last chapter numbers
  sortedReleases.forEach((release) => {
    if (release.year && release.issue !== null) {
      if (!yearlyData.has(release.year)) {
        yearlyData.set(release.year, {
          chapters: 0,
          breaks: 0,
          firstIssue: release.issue,
          lastIssue: release.issue,
          issuesWithChapters: new Set(),
          firstChapter: null,
          lastChapter: null,
        })
      }
      const yearData = yearlyData.get(release.year)!
      yearData.chapters++
      yearData.firstIssue = Math.min(yearData.firstIssue, release.issue)
      yearData.lastIssue = Math.max(yearData.lastIssue, release.issue)

      if (
        yearData.firstChapter === null ||
        release.number < yearData.firstChapter
      ) {
        yearData.firstChapter = release.number
      }
      if (
        yearData.lastChapter === null ||
        release.number > yearData.lastChapter
      ) {
        yearData.lastChapter = release.number
      }

      yearData.issuesWithChapters.add(release.issue)
      if (release.issueEnd !== null && release.issueEnd > release.issue) {
        for (let i = release.issue + 1; i <= release.issueEnd; i++) {
          yearData.issuesWithChapters.add(i)
        }
      }
    }
  })

  // Compute breaks per year
  for (let i = 1; i < sortedReleases.length; i++) {
    const current = sortedReleases[i]
    const previous = sortedReleases[i - 1]

    if (
      !current.year ||
      !previous.year ||
      current.issue === null ||
      previous.issue === null
    ) {
      continue
    }

    if (current.year === previous.year) {
      let weeksBetween = current.issue - previous.issue
      if (previous.issueEnd !== null && previous.issueEnd > previous.issue) {
        weeksBetween -= previous.issueEnd - previous.issue
      }
      weeksBetween -= 1 // expected next issue
      if (previous.issue < 53 && current.issue > 53) {
        weeksBetween -= 1 // skip issue 53
      }
      if (weeksBetween > 0) {
        yearlyData.get(current.year)!.breaks += weeksBetween
      }
    } else if (current.year === previous.year + 1) {
      // Year transition — split breaks across both years
      let totalWeeksBetween = 52 - previous.issue + current.issue
      if (previous.issueEnd !== null && previous.issueEnd > previous.issue) {
        totalWeeksBetween -= previous.issueEnd - previous.issue
      }
      totalWeeksBetween -= 1 // expected next issue
      totalWeeksBetween -= 1 // skip issue 53

      if (totalWeeksBetween > 0) {
        const breaksInPreviousYear =
          52 -
          previous.issue -
          (previous.issueEnd ? previous.issueEnd - previous.issue : 0) -
          1
        const breaksInCurrentYear = current.issue - 1

        if (breaksInPreviousYear > 0 && yearlyData.has(previous.year)) {
          yearlyData.get(previous.year)!.breaks += breaksInPreviousYear
        }
        if (breaksInCurrentYear > 0 && yearlyData.has(current.year)) {
          yearlyData.get(current.year)!.breaks += breaksInCurrentYear
        }
      }
    }
  }

  return Array.from(yearlyData.entries())
    .map(([year, data]) => ({
      year,
      chapters: data.chapters,
      breaks: data.breaks,
      availableWeeks: data.chapters + data.breaks,
      firstChapter: data.firstChapter,
      lastChapter: data.lastChapter,
    }))
    .sort((a, b) => a.year - b.year)
}
