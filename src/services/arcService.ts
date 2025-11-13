import { supabase } from './supabase'
import { Arc } from '../types/arc'

export async function fetchArcs(): Promise<Arc[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
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
      console.error('Error fetching arcs:', arcsResponse.error)
      return []
    }

    if (sagasResponse.error) {
      console.error('Error fetching sagas:', sagasResponse.error)
      // Continue without saga data
    }

    const arcs = arcsResponse.data || []
    const sagas = sagasResponse.data || []

    // Match each arc to a saga based on chapter ranges
    const transformedData: Arc[] = arcs.map((arc) => {
      // Find the saga that contains this arc's start_chapter
      const matchingSaga = sagas.find(
        (saga) =>
          arc.start_chapter >= saga.start_chapter &&
          arc.start_chapter <= saga.end_chapter
      )

      return {
        arc_id: arc.arc_id,
        title: arc.title,
        japanese_title: arc.japanese_title,
        romanized_title: arc.romanized_title,
        start_chapter: arc.start_chapter,
        end_chapter: arc.end_chapter,
        saga_id: matchingSaga?.saga_id || arc.saga_id,
        description: arc.description,
        saga: matchingSaga ? { title: matchingSaga.title } : undefined,
      }
    })

    return transformedData
  } catch (error) {
    console.error('Error in fetchArcs:', error)
    return []
  }
}
