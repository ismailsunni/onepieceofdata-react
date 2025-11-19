import { supabase } from './supabase'
import { Volume } from '../types/volume'

export async function fetchVolumes(): Promise<Volume[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('volume')
      .select('*')
      .order('number', { ascending: true })

    if (error) {
      console.error('Error fetching volumes:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchVolumes:', error)
    return []
  }
}
