import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { CharacterPollEntry } from '../types/characterPoll'

/** PostgREST caps a single response at 2000 rows, and the table is larger than
 *  that, so page through it explicitly. */
const PAGE_SIZE = 1000

export async function fetchCharacterPoll(): Promise<CharacterPollEntry[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const all: CharacterPollEntry[] = []
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('character_poll')
        .select('*')
        .order('poll_id')
        .order('rank')
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        logger.error('Error fetching character poll:', error)
        throw error
      }
      if (!data?.length) break
      all.push(...data)
      if (data.length < PAGE_SIZE) break
    }

    return all
  } catch (error) {
    logger.error('Error in fetchCharacterPoll:', error)
    throw error
  }
}
