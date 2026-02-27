import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { Character } from '../types/character'
import { Arc, Saga } from '../types/arc'
import { Chapter } from '../types/chapter'
import { Volume } from '../types/volume'

export interface SearchResult {
  characters: Character[]
  arcs: Arc[]
  sagas: Saga[]
  chapters: Chapter[]
  volumes: Volume[]
}

/**
 * Search across all entity types for a given query string.
 *
 * Runs five Supabase ILIKE queries in parallel (characters, arcs, sagas,
 * chapters, volumes), each limited to 10 results. Returns empty arrays for
 * all types when query is blank or Supabase is not initialised.
 *
 * @param query - The search term (case-insensitive partial match).
 * @returns Promise resolving to a SearchResult with up to 10 matches per type.
 */
export async function searchAll(query: string): Promise<SearchResult> {
  if (!supabase || !query.trim()) {
    return {
      characters: [],
      arcs: [],
      sagas: [],
      chapters: [],
      volumes: [],
    }
  }

  const searchTerm = `%${query}%`

  try {
    const [charactersRes, arcsRes, sagasRes, chaptersRes, volumesRes] =
      await Promise.all([
        // Search characters
        supabase
          .from('character')
          .select('*')
          .ilike('name', searchTerm)
          .order('appearance_count', { ascending: false, nullsFirst: false })
          .order('name', { ascending: true })
          .limit(10),

        // Search arcs
        supabase
          .from('arc')
          .select('*')
          .ilike('title', searchTerm)
          .order('start_chapter', { ascending: true })
          .limit(10),

        // Search sagas
        supabase
          .from('saga')
          .select('*')
          .ilike('title', searchTerm)
          .order('start_chapter', { ascending: true })
          .limit(10),

        // Search chapters
        supabase
          .from('chapter')
          .select('*')
          .ilike('title', searchTerm)
          .order('number', { ascending: true })
          .limit(10),

        // Search volumes
        supabase
          .from('volume')
          .select('*')
          .ilike('title', searchTerm)
          .order('number', { ascending: true })
          .limit(10),
      ])

    return {
      characters: charactersRes.data || [],
      arcs: arcsRes.data || [],
      sagas: sagasRes.data || [],
      chapters: chaptersRes.data || [],
      volumes: volumesRes.data || [],
    }
  } catch (error) {
    logger.error('Error in searchAll:', error)
    return {
      characters: [],
      arcs: [],
      sagas: [],
      chapters: [],
      volumes: [],
    }
  }
}
