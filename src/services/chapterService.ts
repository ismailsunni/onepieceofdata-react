import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { Chapter } from '../types/chapter'

/**
 * Fetch all chapters ordered by number, with a computed character_count per chapter.
 *
 * Character counts are derived by scanning every character's chapter_list array
 * and tallying appearances per chapter number.
 *
 * @returns Promise resolving to an array of Chapter records (each with
 *   character_count), or [] on error.
 */
export async function fetchChapters(): Promise<Chapter[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('chapter')
      .select('*')
      .order('number', { ascending: true })

    if (error) {
      logger.error('Error fetching chapters:', error)
      return []
    }

    // Get characters with their chapter lists
    const { data: characters, error: charactersError } = await supabase
      .from('character')
      .select('chapter_list')

    if (charactersError) {
      logger.error('Error fetching characters for counts:', charactersError)
      // Continue without character counts
      return data || []
    }

    // Count characters per chapter by checking chapter_list arrays
    const characterCounts = new Map<number, number>()
    characters?.forEach((character: { chapter_list: number[] | null }) => {
      if (character.chapter_list && Array.isArray(character.chapter_list)) {
        character.chapter_list.forEach((chapterNum) => {
          const count = characterCounts.get(chapterNum) || 0
          characterCounts.set(chapterNum, count + 1)
        })
      }
    })

    // Add character counts to chapters
    const chaptersWithCounts = (data || []).map((chapter) => ({
      ...chapter,
      character_count: characterCounts.get(chapter.number) || 0,
    }))

    return chaptersWithCounts
  } catch (error) {
    logger.error('Error in fetchChapters:', error)
    return []
  }
}
