import { supabase } from './supabase'
import { Saga } from '../types/arc'

export async function fetchSagas(): Promise<Saga[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('saga')
      .select('*')
      .order('start_chapter', { ascending: true })

    if (error) {
      console.error('Error fetching sagas:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchSagas:', error)
    return []
  }
}
