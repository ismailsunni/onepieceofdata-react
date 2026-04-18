import { supabase } from './supabase'
import { logger } from '../utils/logger'
import type { CharacterDevilFruit } from '../types/devilFruit'

export async function fetchDevilFruitsByCharacter(
  characterId: string
): Promise<CharacterDevilFruit[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character_devil_fruit')
      .select('*')
      .eq('character_id', characterId)
      .order('fruit_name')

    if (error) {
      logger.error('Error fetching devil fruits:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchDevilFruitsByCharacter:', error)
    return []
  }
}

export async function fetchAllDevilFruits(): Promise<CharacterDevilFruit[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character_devil_fruit')
      .select('*')
      .order('fruit_name')

    if (error) {
      logger.error('Error fetching all devil fruits:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchAllDevilFruits:', error)
    return []
  }
}
