import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { Volume } from '../types/volume'

export async function fetchVolumes(): Promise<Volume[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('volume')
      .select('*')
      .order('number', { ascending: true })

    if (error) {
      logger.error('Error fetching volumes:', error)
      return []
    }

    // Fetch all chapters to calculate volume statistics
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapter')
      .select('number, volume, num_page')

    if (chaptersError) {
      logger.error('Error fetching chapters for volume stats:', chaptersError)
      // Return volumes without additional stats
      return data || []
    }

    // Fetch all characters to calculate cover appearances
    const { data: characters, error: charactersError } = await supabase
      .from('character')
      .select('cover_volume_list')

    if (charactersError) {
      logger.error('Error fetching characters for cover stats:', charactersError)
      // Continue without cover stats
    }

    // Calculate stats for each volume
    const volumesWithStats = (data || []).map((volume) => {
      // Filter chapters for this volume
      const volumeChapters = chapters?.filter(
        (chapter) => chapter.volume === volume.number
      ) || []

      // Calculate stats
      const chapter_count = volumeChapters.length
      const total_pages = volumeChapters.reduce(
        (sum, chapter) => sum + (chapter.num_page || 0),
        0
      )

      const chapterNumbers = volumeChapters
        .map((ch) => ch.number)
        .sort((a, b) => a - b)

      const start_chapter = chapterNumbers.length > 0 ? chapterNumbers[0] : undefined
      const end_chapter = chapterNumbers.length > 0
        ? chapterNumbers[chapterNumbers.length - 1]
        : undefined

      const chapter_range = start_chapter && end_chapter
        ? start_chapter === end_chapter
          ? `${start_chapter}`
          : `${start_chapter}-${end_chapter}`
        : '-'

      // Count characters that appear on this volume's cover
      const cover_character_count = characters?.filter(
        (character) => character.cover_volume_list &&
                      Array.isArray(character.cover_volume_list) &&
                      character.cover_volume_list.includes(volume.number)
      ).length || 0

      return {
        ...volume,
        chapter_count,
        total_pages: total_pages > 0 ? total_pages : undefined,
        chapter_range,
        start_chapter,
        end_chapter,
        cover_character_count: cover_character_count > 0 ? cover_character_count : undefined,
      }
    })

    return volumesWithStats
  } catch (error) {
    logger.error('Error in fetchVolumes:', error)
    return []
  }
}
