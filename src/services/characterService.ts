import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { Character } from '../types/character'

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
