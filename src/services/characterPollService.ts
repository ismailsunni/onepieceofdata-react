import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { CharacterPollEntry } from '../types/characterPoll'

export async function fetchCharacterPoll(): Promise<CharacterPollEntry[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character_poll')
      .select('*')
      .order('poll_id')
      .order('rank')

    if (error) {
      logger.error('Error fetching character poll:', error)
      throw error
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharacterPoll:', error)
    throw error
  }
}
