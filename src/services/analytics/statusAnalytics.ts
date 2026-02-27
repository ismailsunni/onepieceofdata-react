import { supabase } from '../supabase'
import { logger } from '../../utils/logger'

export interface StatusDistribution {
  status: string
  count: number
  color: string
  [key: string]: string | number // Index signature for recharts compatibility
}

/**
 * Get distribution of character statuses (Alive, Deceased, Unknown)
 */
export async function fetchStatusDistribution(): Promise<StatusDistribution[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase.from('character').select('status')

    if (error) {
      logger.error('Error fetching status data:', error)
      return []
    }

    // Count each status
    const statusMap = new Map<string, number>()
    data.forEach((char) => {
      const status = char.status || 'Unknown'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    // Define colors for each status
    const colorMap: { [key: string]: string } = {
      Alive: '#10b981',
      Deceased: '#ef4444',
      Unknown: '#6b7280',
    }

    // Convert to array format
    const distribution: StatusDistribution[] = Array.from(
      statusMap.entries()
    ).map(([status, count]) => ({
      status,
      count,
      color: colorMap[status] || '#9ca3af',
    }))

    return distribution.sort((a, b) => b.count - a.count)
  } catch (error) {
    logger.error('Error in fetchStatusDistribution:', error)
    return []
  }
}
