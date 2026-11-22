import { queryOptions } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { logger } from '../utils/logger'
import { Arc } from '../types/arc'
import { Character } from '../types/character'
import { Chapter } from '../types/chapter'

// Service functions
async function fetchArcById(id: string): Promise<Arc | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('arc')
      .select('*, saga:saga_id(title)')
      .eq('arc_id', id)
      .single()

    if (error) {
      logger.error('Error fetching arc:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchArcById:', error)
    return null
  }
}

async function fetchChaptersByArc(
  startChapter: number,
  endChapter: number
): Promise<Chapter[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('chapter')
      .select('*')
      .gte('number', startChapter)
      .lte('number', endChapter)
      .order('number', { ascending: true })

    if (error) {
      logger.error('Error fetching chapters by arc:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchChaptersByArc:', error)
    return []
  }
}

export async function fetchCharactersByArc(
  arcId: string
): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('arc_list', [arcId])
      .order('first_appearance', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by arc:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersByArc:', error)
    return []
  }
}

// Shared by ArcDetailPage and the build-time prefetch
export const arcQuery = (id: string) =>
  queryOptions({ queryKey: ['arc', id], queryFn: () => fetchArcById(id) })

export const arcChaptersQuery = (arc: Arc | null | undefined) =>
  queryOptions({
    queryKey: ['arc-chapters', arc?.start_chapter, arc?.end_chapter],
    queryFn: () => fetchChaptersByArc(arc!.start_chapter, arc!.end_chapter),
    enabled: !!arc,
  })
