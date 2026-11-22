import { queryOptions } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { logger } from '../utils/logger'
import { Arc, Saga } from '../types/arc'
import { Character } from '../types/character'

// Service functions
async function fetchSagaById(id: string): Promise<Saga | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('saga')
      .select('*')
      .eq('saga_id', id)
      .single()

    if (error) {
      logger.error('Error fetching saga:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchSagaById:', error)
    return null
  }
}

async function fetchArcsBySaga(sagaId: string): Promise<Arc[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('arc')
      .select('*')
      .eq('saga_id', sagaId)
      .order('start_chapter', { ascending: true })

    if (error) {
      logger.error('Error fetching arcs by saga:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchArcsBySaga:', error)
    return []
  }
}

export async function fetchCharactersBySaga(
  sagaId: string
): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('saga_list', [sagaId])
      .order('first_appearance', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by saga:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersBySaga:', error)
    return []
  }
}

async function fetchVolumeRange(
  startChapter: number,
  endChapter: number
): Promise<{ startVol: number | null; endVol: number | null }> {
  if (!supabase) return { startVol: null, endVol: null }
  const { data } = await supabase
    .from('chapter')
    .select('volume')
    .gte('number', startChapter)
    .lte('number', endChapter)
    .not('volume', 'is', null)
    .order('volume', { ascending: true })
  if (!data || data.length === 0) return { startVol: null, endVol: null }
  const volumes = data.map((d) => d.volume).filter(Boolean) as number[]
  return { startVol: Math.min(...volumes), endVol: Math.max(...volumes) }
}

// Shared by SagaDetailPage and the build-time prefetch
export const sagaQuery = (id: string) =>
  queryOptions({ queryKey: ['saga', id], queryFn: () => fetchSagaById(id) })

export const sagaArcsQuery = (saga: Saga | null | undefined) =>
  queryOptions({
    queryKey: ['saga-arcs', saga?.saga_id],
    queryFn: () => fetchArcsBySaga(saga!.saga_id),
    enabled: !!saga,
  })

export const sagaVolumesQuery = (saga: Saga | null | undefined) =>
  queryOptions({
    queryKey: ['saga-volumes', saga?.start_chapter, saga?.end_chapter],
    queryFn: () => fetchVolumeRange(saga!.start_chapter, saga!.end_chapter),
    enabled: !!saga,
  })
