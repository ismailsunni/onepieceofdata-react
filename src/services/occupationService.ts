import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { CharacterOccupation } from '../types/occupation'

export async function fetchOccupationsByCharacter(
  characterId: string
): Promise<CharacterOccupation[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character_occupation')
      .select('*')
      .eq('character_id', characterId)
      .order('role')

    if (error) {
      logger.error('Error fetching occupations:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchOccupationsByCharacter:', error)
    return []
  }
}

export async function fetchAllOccupations(): Promise<CharacterOccupation[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character_occupation')
      .select('*')
      .order('role')

    if (error) {
      logger.error('Error fetching all occupations:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchAllOccupations:', error)
    return []
  }
}
