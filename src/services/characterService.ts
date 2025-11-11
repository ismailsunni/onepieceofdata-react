import { supabase } from './supabase'
import { Character } from '../types/character'

export async function fetchCharacters(): Promise<Character[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching characters:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchCharacters:', error)
    return []
  }
}
