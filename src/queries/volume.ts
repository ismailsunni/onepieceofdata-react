import { queryOptions } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { logger } from '../utils/logger'
import { Character } from '../types/character'
import { Chapter } from '../types/chapter'
import { Volume } from '../types/volume'

// Service functions
async function fetchVolumeByNumber(
  volumeNumber: number
): Promise<Volume | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('volume')
      .select('*')
      .eq('number', volumeNumber)
      .single()

    if (error) {
      logger.error('Error fetching volume:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchVolumeByNumber:', error)
    return null
  }
}

async function fetchChaptersByVolume(volumeNumber: number): Promise<Chapter[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('chapter')
      .select('*')
      .eq('volume', volumeNumber)
      .order('number', { ascending: true })

    if (error) {
      logger.error('Error fetching chapters by volume:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchChaptersByVolume:', error)
    return []
  }
}

export async function fetchCharactersByVolume(
  volumeNumber: number
): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('volume_list', [volumeNumber])
      .order('first_appearance', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by volume:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersByVolume:', error)
    return []
  }
}

async function fetchCharactersByCoverVolume(
  volumeNumber: number
): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('cover_volume_list', [volumeNumber])
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by cover volume:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersByCoverVolume:', error)
    return []
  }
}

// Shared by VolumeDetailPage and the build-time prefetch
export const volumeQueries = (n: number) => ({
  volume: queryOptions({
    queryKey: ['volume', n],
    queryFn: () => fetchVolumeByNumber(n),
  }),
  chapters: queryOptions({
    queryKey: ['volume-chapters', n],
    queryFn: () => fetchChaptersByVolume(n),
  }),
  coverCharacters: queryOptions({
    queryKey: ['volume-cover-characters', n],
    queryFn: () => fetchCharactersByCoverVolume(n),
  }),
})
