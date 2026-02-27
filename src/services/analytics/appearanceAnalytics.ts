import { supabase } from '../supabase'
import { Saga } from '../../types/arc'
import { logger } from '../../utils/logger'

export interface AppearanceData {
  chapterRange: string
  characterCount: number
}

export interface SagaAppearanceData {
  sagaName: string
  characterCount: number
  sagaOrder: number
  chapterCount: number
}

export interface SagaAppearanceCountData {
  sagaCount: string // "1 saga", "2 sagas", etc.
  characterCount: number
}

export interface TimeSkipData {
  preTimeSkipOnly: number
  postTimeSkipOnly: number
  both: number
  total: number
}

/**
 * Get character appearance distribution over chapter ranges
 */
export async function fetchAppearanceDistribution(): Promise<AppearanceData[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('appearance_count')
      .not('appearance_count', 'is', null)
      .gt('appearance_count', 0)

    if (error) {
      logger.error('Error fetching appearance data:', error)
      return []
    }

    // Define appearance ranges
    const ranges = [
      { min: 1, max: 10, label: '1-10' },
      { min: 10, max: 50, label: '10-50' },
      { min: 50, max: 100, label: '50-100' },
      { min: 100, max: 200, label: '100-200' },
      { min: 200, max: 500, label: '200-500' },
      { min: 500, max: Infinity, label: '500+' },
    ]

    // Count characters in each range
    const distribution: AppearanceData[] = ranges.map((range) => {
      const count = data.filter(
        (char) =>
          char.appearance_count! >= range.min &&
          char.appearance_count! < range.max
      ).length
      return {
        chapterRange: range.label,
        characterCount: count,
      }
    })

    return distribution
  } catch (error) {
    logger.error('Error in fetchAppearanceDistribution:', error)
    return []
  }
}

/**
 * Get character appearance distribution by saga
 * Shows how many characters first appeared in each saga
 */
export async function fetchSagaAppearanceDistribution(): Promise<
  SagaAppearanceData[]
> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    // Fetch all sagas
    const { data: sagas, error: sagasError } = await supabase
      .from('saga')
      .select<'*', Saga>('*')
      .order('start_chapter', { ascending: true })

    if (sagasError) {
      logger.error('Error fetching sagas:', sagasError)
      return []
    }

    // Fetch all characters with their first appearance
    const { data: characters, error: charactersError } = await supabase
      .from('character')
      .select('first_appearance')
      .not('first_appearance', 'is', null)

    if (charactersError) {
      logger.error('Error fetching characters:', charactersError)
      return []
    }

    // Count characters that first appeared in each saga
    const distribution: SagaAppearanceData[] = sagas.map((saga, index) => {
      const count = characters.filter(
        (char) =>
          char.first_appearance >= saga.start_chapter &&
          char.first_appearance <= saga.end_chapter
      ).length

      const chapterCount = saga.end_chapter - saga.start_chapter + 1

      return {
        sagaName: saga.title,
        characterCount: count,
        sagaOrder: index + 1,
        chapterCount,
      }
    })

    return distribution
  } catch (error) {
    logger.error('Error in fetchSagaAppearanceDistribution:', error)
    return []
  }
}

/**
 * Get character saga appearance count distribution
 * Shows how many characters appear in 1 saga, 2 sagas, 3 sagas, etc.
 */
export async function fetchSagaAppearanceCountDistribution(): Promise<
  SagaAppearanceCountData[]
> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    // Fetch all characters with their saga_list
    const { data: characters, error: charactersError } = await supabase
      .from('character')
      .select('saga_list')
      .not('saga_list', 'is', null)

    if (charactersError) {
      logger.error('Error fetching characters:', charactersError)
      return []
    }

    // Count how many characters appear in each saga count
    const sagaCountMap = new Map<number, number>() // saga count -> character count

    characters.forEach((char) => {
      const sagaCount = char.saga_list?.length || 0
      if (sagaCount > 0) {
        sagaCountMap.set(sagaCount, (sagaCountMap.get(sagaCount) || 0) + 1)
      }
    })

    // Convert to array format for chart
    const distribution: SagaAppearanceCountData[] = []
    const maxSagas = Math.max(...Array.from(sagaCountMap.keys()), 11) // At least show up to 11 sagas

    for (let i = 1; i <= maxSagas; i++) {
      distribution.push({
        sagaCount: i === 1 ? '1 saga' : `${i} sagas`,
        characterCount: sagaCountMap.get(i) || 0,
      })
    }

    return distribution
  } catch (error) {
    logger.error('Error in fetchSagaAppearanceCountDistribution:', error)
    return []
  }
}

/**
 * Get time skip character distribution
 * The time skip occurs at chapter 597 (end of Marineford) to 598 (Return to Sabaody)
 * Categories:
 * - Pre-time skip only: Characters who appeared only before chapter 598
 * - Post-time skip only: Characters who appeared only from chapter 598 onwards
 * - Both: Characters who appeared in both periods
 */
export async function fetchTimeSkipDistribution(): Promise<TimeSkipData> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return { preTimeSkipOnly: 0, postTimeSkipOnly: 0, both: 0, total: 0 }
    }

    const TIME_SKIP_CHAPTER = 598

    // Fetch all characters with their chapter_list
    const { data: characters, error } = await supabase
      .from('character')
      .select('chapter_list')
      .not('chapter_list', 'is', null)

    if (error) {
      logger.error('Error fetching time skip data:', error)
      return { preTimeSkipOnly: 0, postTimeSkipOnly: 0, both: 0, total: 0 }
    }

    let preTimeSkipOnly = 0
    let postTimeSkipOnly = 0
    let both = 0

    characters.forEach((char) => {
      const chapters = char.chapter_list || []
      if (chapters.length === 0) return

      const hasPreTimeSkip = chapters.some(
        (ch: number) => ch < TIME_SKIP_CHAPTER
      )
      const hasPostTimeSkip = chapters.some(
        (ch: number) => ch >= TIME_SKIP_CHAPTER
      )

      if (hasPreTimeSkip && hasPostTimeSkip) {
        both++
      } else if (hasPreTimeSkip) {
        preTimeSkipOnly++
      } else if (hasPostTimeSkip) {
        postTimeSkipOnly++
      }
    })

    return {
      preTimeSkipOnly,
      postTimeSkipOnly,
      both,
      total: preTimeSkipOnly + postTimeSkipOnly + both,
    }
  } catch (error) {
    logger.error('Error in fetchTimeSkipDistribution:', error)
    return { preTimeSkipOnly: 0, postTimeSkipOnly: 0, both: 0, total: 0 }
  }
}
