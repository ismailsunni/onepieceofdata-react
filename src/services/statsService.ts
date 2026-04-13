import { supabase } from './supabase'
import { logger } from '../utils/logger'

export interface DatabaseStats {
  chapters: number
  volumes: number
  arcs: number
  sagas: number
  characters: number
  affiliations: number
  totalPages: number
  publicationSpan: string
}

/**
 * Fetch aggregate statistics for the entire database.
 *
 * Issues parallel COUNT queries for chapters, volumes, arcs, sagas, and
 * characters. Also computes:
 * - totalPages: sum of num_page across all chapters
 * - publicationSpan: number of days between the oldest and newest chapter
 *   dates (formatted with toLocaleString), or 'Unknown' if dates are absent.
 *
 * @returns Promise resolving to a DatabaseStats object. Returns zero-value
 *   defaults if Supabase is not configured or any query fails.
 * @throws {Error} If Supabase client is not initialised.
 */
export async function fetchDatabaseStats(): Promise<DatabaseStats> {
  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      logger.error(
        'Supabase client is not initialized. Check your .env.local file.'
      )
      throw new Error('Supabase not configured')
    }

    // Fetch counts from different tables (note: table names are singular).
    // For affiliations we pull group_name values and dedupe in JS because
    // PostgREST does not expose a DISTINCT COUNT.
    const [
      chaptersResult,
      volumesResult,
      arcsResult,
      sagasResult,
      charactersResult,
      affiliationsResult,
    ] = await Promise.all([
      supabase.from('chapter').select('*', { count: 'exact', head: true }),
      supabase.from('volume').select('*', { count: 'exact', head: true }),
      supabase.from('arc').select('*', { count: 'exact', head: true }),
      supabase.from('saga').select('*', { count: 'exact', head: true }),
      supabase.from('character').select('*', { count: 'exact', head: true }),
      supabase.from('character_affiliation').select('group_name'),
    ])

    // Check for errors in any of the queries
    if (chaptersResult.error) {
      logger.error('Chapter query error:', {
        message: chaptersResult.error.message,
        details: chaptersResult.error.details,
        hint: chaptersResult.error.hint,
        code: chaptersResult.error.code,
      })
    }
    if (volumesResult.error)
      logger.error('Volume query error:', volumesResult.error)
    if (arcsResult.error) logger.error('Arc query error:', arcsResult.error)
    if (sagasResult.error) logger.error('Saga query error:', sagasResult.error)
    if (charactersResult.error)
      logger.error('Character query error:', charactersResult.error)
    if (affiliationsResult.error)
      logger.error('Affiliation query error:', affiliationsResult.error)

    const uniqueAffiliations = new Set(
      (affiliationsResult.data || [])
        .map((row: { group_name: string | null }) => row.group_name)
        .filter((name): name is string => !!name)
    ).size

    // Calculate total pages from chapters (column is num_page)
    const { data: chaptersData } = await supabase
      .from('chapter')
      .select('num_page')

    const totalPages =
      chaptersData?.reduce(
        (sum, chapter) => sum + (chapter.num_page || 0),
        0
      ) || 0

    // Get publication span from chapter dates
    const { data: firstChapter } = await supabase
      .from('chapter')
      .select('date')
      .not('date', 'is', null)
      .order('date', { ascending: true })
      .limit(1)
      .single()

    const { data: lastChapter } = await supabase
      .from('chapter')
      .select('date')
      .not('date', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    let publicationSpan = 'Unknown'
    if (firstChapter?.date && lastChapter?.date) {
      const startDate = new Date(firstChapter.date)
      const endDate = new Date(lastChapter.date)

      // Calculate total days difference
      const diffInMs = endDate.getTime() - startDate.getTime()
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

      publicationSpan = diffInDays.toLocaleString()
    }

    return {
      chapters: chaptersResult.count || 0,
      volumes: volumesResult.count || 0,
      arcs: arcsResult.count || 0,
      sagas: sagasResult.count || 0,
      characters: charactersResult.count || 0,
      affiliations: uniqueAffiliations,
      totalPages,
      publicationSpan,
    }
  } catch (error) {
    logger.error('Error fetching database stats:', error)
    // Return default values on error
    return {
      chapters: 0,
      volumes: 0,
      arcs: 0,
      sagas: 0,
      characters: 0,
      affiliations: 0,
      totalPages: 0,
      publicationSpan: 'Unknown',
    }
  }
}
