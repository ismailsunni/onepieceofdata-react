import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { Character } from '../types/character'

/**
 * Fetch all characters ordered alphabetically by name.
 *
 * @returns Promise resolving to an array of Character records, or [] on error.
 */
export async function fetchCharacters(): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching characters:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharacters:', error)
    return []
  }
}

/**
 * Fetch a single character by primary key.
 *
 * @returns The matching Character row or null if not found / on error.
 */
export async function fetchCharacterById(
  id: string
): Promise<Character | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }
    const { data, error } = await supabase
      .from('character')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      logger.error('Error fetching character by id:', error)
      return null
    }
    return data
  } catch (error) {
    logger.error('Error in fetchCharacterById:', error)
    return null
  }
}
