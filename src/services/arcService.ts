import { supabase } from './supabase'
import { logger } from '../utils/logger'
import { Arc } from '../types/arc'

export async function fetchArcs(): Promise<Arc[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    // Fetch arcs and sagas separately
    const [arcsResponse, sagasResponse] = await Promise.all([
      supabase
        .from('arc')
        .select('*')
        .order('start_chapter', { ascending: true }),
      supabase
        .from('saga')
        .select('*')
        .order('start_chapter', { ascending: true }),
    ])

    if (arcsResponse.error) {
      logger.error('Error fetching arcs:', arcsResponse.error)
      return []
    }

    if (sagasResponse.error) {
      logger.error('Error fetching sagas:', sagasResponse.error)
      // Continue without saga data
    }

    const arcs = arcsResponse.data || []
    const sagas = sagasResponse.data || []

    // Transform arcs data and match with sagas
    const transformedData: Arc[] = arcs.map((arc) => {
      // Use saga_id from database if it exists, otherwise compute based on chapter ranges
      let sagaId = arc.saga_id
      let matchingSaga = null

      if (sagaId) {
        // If saga_id exists in arc, find the matching saga by ID
        matchingSaga = sagas.find((saga) => saga.saga_id === sagaId)
      } else {
        // Fallback: compute saga based on chapter ranges if saga_id is missing
        matchingSaga = sagas.find(
          (saga) =>
            arc.start_chapter >= saga.start_chapter &&
            arc.start_chapter <= saga.end_chapter
        )
        sagaId = matchingSaga?.saga_id || null
      }

      return {
        arc_id: arc.arc_id,
        title: arc.title,
        japanese_title: arc.japanese_title,
        romanized_title: arc.romanized_title,
        start_chapter: arc.start_chapter,
        end_chapter: arc.end_chapter,
        saga_id: sagaId,
        description: arc.description,
        saga: matchingSaga ? { title: matchingSaga.title } : undefined,
      }
    })

    return transformedData
  } catch (error) {
    logger.error('Error in fetchArcs:', error)
    return []
  }
}
