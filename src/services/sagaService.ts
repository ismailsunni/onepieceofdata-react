import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { Saga } from '../types/arc'

/**
 * Fetch all sagas ordered by start_chapter.
 *
 * @returns Promise resolving to an array of Saga records, or [] on error.
 */
export async function fetchSagas(): Promise<Saga[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('saga')
      .select('*')
      .order('start_chapter', { ascending: true })

    if (error) {
      logger.error('Error fetching sagas:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchSagas:', error)
    return []
  }
}
