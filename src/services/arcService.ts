import { supabase } from './supabase'
import { Arc } from '../types/arc'

interface ArcWithSagaArray extends Omit<Arc, 'saga'> {
  saga?: Array<{ title: string }> | { title: string }
}

export async function fetchArcs(): Promise<Arc[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('arc')
      .select(
        `
        *,
        saga!fk_arc_saga (
          title
        )
      `
      )
      .order('start_chapter', { ascending: true })

    if (error) {
      console.error('Error fetching arcs:', error)
      return []
    }

    console.log('Raw arc data:', data) // Debug log

    // Transform the data to flatten the saga object
    const transformedData: Arc[] = ((data as ArcWithSagaArray[]) || []).map(
      (arc) => {
        console.log('Processing arc:', arc.title, 'saga:', arc.saga) // Debug log

        let sagaData: { title: string } | undefined = undefined
        if (arc.saga) {
          if (Array.isArray(arc.saga) && arc.saga.length > 0) {
            sagaData = arc.saga[0]
          } else if (typeof arc.saga === 'object' && 'title' in arc.saga) {
            sagaData = arc.saga
          }
        }

        return {
          arc_id: arc.arc_id,
          title: arc.title,
          japanese_title: arc.japanese_title,
          romanized_title: arc.romanized_title,
          start_chapter: arc.start_chapter,
          end_chapter: arc.end_chapter,
          saga_id: arc.saga_id,
          description: arc.description,
          saga: sagaData,
        }
      }
    )

    return transformedData
  } catch (error) {
    console.error('Error in fetchArcs:', error)
    return []
  }
}
