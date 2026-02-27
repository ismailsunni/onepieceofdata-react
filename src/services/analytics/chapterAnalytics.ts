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
  luffyAppears: boolean
}

/**
 * Parse Jump issue number from various formats
 * Examples: "1997 Issue 34", "1997 Issue 37-38" (double issue), "2024 Issue 1"
 */
function parseJumpIssue(jump: string | null, date: string | null): { year: number; issue: number; issueEnd: number | null } | null {
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
    } catch (e) {
      logger.warn('Error parsing date:', date)
    }
  }

  // Check if it has year prefix (e.g., "1997-34" or "2024-01")
  const yearIssueMatch = jumpStr.match(/^(\d{4})[-\/](\d+)/)
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
    return year ? {
      year,
      issue: parseInt(oldDoubleIssueMatch[1]),
      issueEnd: parseInt(oldDoubleIssueMatch[2]),
    } : null
  }

  // Check for simple number like "34"
  const simpleMatch = jumpStr.match(/^(\d+)$/)
  if (simpleMatch) {
    return year ? { year, issue: parseInt(simpleMatch[1]), issueEnd: null } : null
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

    // Fetch chapters, arcs, sagas, and Luffy's data in parallel
    const [chaptersRes, arcsRes, sagasRes, luffyRes] = await Promise.all([
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
      supabase
        .from('character')
        .select('chapter_list')
        .eq('name', 'Monkey D. Luffy')
        .single(),
    ])

    if (chaptersRes.error) {
      logger.error('Error fetching chapters:', chaptersRes.error)
      return []
    }

    const chapters = chaptersRes.data || []
    const arcs = arcsRes.data || []
    const sagas = sagasRes.data || []
    const luffyChapters = new Set(luffyRes.data?.chapter_list || [])

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
        luffyAppears: luffyChapters.has(chapter.number),
      }
    })

    return releases
  } catch (error) {
    logger.error('Error in fetchChapterReleases:', error)
    return []
  }
}
