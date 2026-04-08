import { supabase } from '../supabase'
import { logger } from '../../utils/logger'

export interface RegionBountyCharacter {
  name: string
  bounty: number
  status: string | null
  origin_region: string
}

export interface RegionBountyStats {
  region: string
  totalBounty: number
  averageBounty: number
  medianBounty: number
  avgTop5Bounty: number
  medianTop5Bounty: number
  characterCount: number
  topCharacters: RegionBountyCharacter[]
}

/**
 * Fetch characters with bounties grouped by origin_region.
 * Returns per-region stats: total, average, count, and top characters.
 */
export async function fetchRegionBountyData(
  excludeDead: boolean = false
): Promise<RegionBountyStats[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('character')
      .select('name, bounty, status, origin_region')
      .not('bounty', 'is', null)
      .gt('bounty', 0)
      .not('origin_region', 'is', null)

    if (excludeDead) {
      query = query.eq('status', 'Alive')
    }

    const { data, error } = await query.order('bounty', { ascending: false })

    if (error) {
      logger.error('Error fetching region bounty data:', error)
      return []
    }

    // Group by region
    const regionMap = new Map<string, RegionBountyCharacter[]>()
    for (const char of data) {
      const region = char.origin_region as string
      if (!regionMap.has(region)) {
        regionMap.set(region, [])
      }
      regionMap.get(region)!.push({
        name: char.name || 'Unknown',
        bounty: char.bounty || 0,
        status: char.status,
        origin_region: region,
      })
    }

    // Build stats per region
    const stats: RegionBountyStats[] = []
    for (const [region, characters] of regionMap) {
      const totalBounty = characters.reduce((sum, c) => sum + c.bounty, 0)
      const sorted = [...characters].sort((a, b) => a.bounty - b.bounty)
      const mid = Math.floor(sorted.length / 2)
      const medianBounty =
        sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1].bounty + sorted[mid].bounty) / 2)
          : sorted[mid].bounty
      // Top 5 stats (characters are already sorted desc by bounty from query)
      const top5 = characters.slice(0, 5)
      const avgTop5Bounty = Math.round(
        top5.reduce((sum, c) => sum + c.bounty, 0) / top5.length
      )
      const top5Sorted = [...top5].sort((a, b) => a.bounty - b.bounty)
      const mid5 = Math.floor(top5Sorted.length / 2)
      const medianTop5Bounty =
        top5Sorted.length % 2 === 0
          ? Math.round(
              (top5Sorted[mid5 - 1].bounty + top5Sorted[mid5].bounty) / 2
            )
          : top5Sorted[mid5].bounty

      stats.push({
        region,
        totalBounty,
        averageBounty: Math.round(totalBounty / characters.length),
        medianBounty,
        avgTop5Bounty,
        medianTop5Bounty,
        characterCount: characters.length,
        topCharacters: characters, // already sorted by bounty desc from query
      })
    }

    // Sort by total bounty descending
    stats.sort((a, b) => b.totalBounty - a.totalBounty)

    return stats
  } catch (error) {
    logger.error('Error in fetchRegionBountyData:', error)
    return []
  }
}
