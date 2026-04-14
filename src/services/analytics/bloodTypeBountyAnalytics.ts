import { supabase } from '../supabase'
import { logger } from '../../utils/logger'

export interface BloodTypeBountyCharacter {
  name: string
  bounty: number
  status: string | null
  bloodType: string
}

export interface BloodTypeBountyStats {
  bloodType: string
  totalBounty: number
  averageBounty: number
  medianBounty: number
  avgTop5Bounty: number
  characterCount: number
  topCharacters: BloodTypeBountyCharacter[]
}

/**
 * Fetch characters with bounties grouped by blood_type_group.
 * Returns per-blood-type stats: total, average, median, count, and top characters.
 */
export async function fetchBloodTypeBountyData(
  excludeDead: boolean = false
): Promise<BloodTypeBountyStats[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('character')
      .select('name, bounty, status, blood_type_group')
      .not('bounty', 'is', null)
      .gt('bounty', 0)
      .not('blood_type_group', 'is', null)

    if (excludeDead) {
      query = query.eq('status', 'Alive')
    }

    const { data, error } = await query.order('bounty', { ascending: false })

    if (error) {
      logger.error('Error fetching blood type bounty data:', error)
      return []
    }

    // Group by blood type
    const btMap = new Map<string, BloodTypeBountyCharacter[]>()
    for (const char of data) {
      const bt = (char.blood_type_group as string).trim()
      if (!bt) continue
      if (!btMap.has(bt)) {
        btMap.set(bt, [])
      }
      btMap.get(bt)!.push({
        name: char.name || 'Unknown',
        bounty: char.bounty || 0,
        status: char.status,
        bloodType: bt,
      })
    }

    // Build stats per blood type
    const stats: BloodTypeBountyStats[] = []
    for (const [bloodType, characters] of btMap) {
      const totalBounty = characters.reduce((sum, c) => sum + c.bounty, 0)
      const sorted = [...characters].sort((a, b) => a.bounty - b.bounty)
      const mid = Math.floor(sorted.length / 2)
      const medianBounty =
        sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1].bounty + sorted[mid].bounty) / 2)
          : sorted[mid].bounty
      const top5 = characters.slice(0, 5)
      const avgTop5Bounty = Math.round(
        top5.reduce((sum, c) => sum + c.bounty, 0) / top5.length
      )

      stats.push({
        bloodType,
        totalBounty,
        averageBounty: Math.round(totalBounty / characters.length),
        medianBounty,
        avgTop5Bounty,
        characterCount: characters.length,
        topCharacters: characters,
      })
    }

    stats.sort((a, b) => b.totalBounty - a.totalBounty)

    return stats
  } catch (error) {
    logger.error('Error in fetchBloodTypeBountyData:', error)
    return []
  }
}
