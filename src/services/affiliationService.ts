import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { CharacterAffiliation } from '../types/affiliation'

export async function fetchAffiliationsByCharacter(
  characterId: string
): Promise<CharacterAffiliation[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character_affiliation')
      .select('*')
      .eq('character_id', characterId)
      .order('group_name')

    if (error) {
      logger.error('Error fetching affiliations:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchAffiliationsByCharacter:', error)
    return []
  }
}

export async function fetchAllAffiliations(): Promise<CharacterAffiliation[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character_affiliation')
      .select('*')
      .order('group_name')

    if (error) {
      logger.error('Error fetching all affiliations:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchAllAffiliations:', error)
    return []
  }
}
