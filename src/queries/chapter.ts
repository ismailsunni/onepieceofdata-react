import { queryOptions } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { logger } from '../utils/logger'
import { Arc } from '../types/arc'
import { Character } from '../types/character'
import { Chapter } from '../types/chapter'

// Service function to fetch a single chapter by number
async function fetchChapterByNumber(
  chapterNumber: number
): Promise<Chapter | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('chapter')
      .select('*')
      .eq('number', chapterNumber)
      .single()

    if (error) {
      logger.error('Error fetching chapter:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchChapterByNumber:', error)
    return null
  }
}

// Service function to fetch characters that appear in this chapter
async function fetchCharactersByChapter(
  chapterNumber: number
): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('chapter_list', [chapterNumber])
      .order('first_appearance', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by chapter:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersByChapter:', error)
    return []
  }
}

type ArcWithSagaRange = Arc & {
  saga?: { title: string; start_chapter: number; end_chapter: number }
}

// Service function to fetch arc for this chapter
async function fetchArcByChapter(
  chapterNumber: number
): Promise<ArcWithSagaRange | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('arc')
      .select('*, saga:saga_id(title, start_chapter, end_chapter)')
      .lte('start_chapter', chapterNumber)
      .gte('end_chapter', chapterNumber)
      .single()

    if (error) {
      logger.error('Error fetching arc by chapter:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchArcByChapter:', error)
    return null
  }
}

// Shared by ChapterDetailPage and the build-time prefetch
export const chapterQueries = (n: number) => ({
  chapter: queryOptions({
    queryKey: ['chapter', n],
    queryFn: () => fetchChapterByNumber(n),
  }),
  characters: queryOptions({
    queryKey: ['chapter-characters', n],
    queryFn: () => fetchCharactersByChapter(n),
  }),
  arc: queryOptions({
    queryKey: ['chapter-arc', n],
    queryFn: () => fetchArcByChapter(n),
  }),
})
