import { supabase } from '../supabase'
import { logger } from '../../utils/logger'

export interface BountyRange {
  range: string
  count: number
  color: string
  powerTier: string // Store the power tier name separately
  alive: number // Count of alive characters
  notAlive: number // Count of deceased/unknown characters
  examples: { name: string; bounty: number }[] // Top 3 example characters
}

export interface BountyStats {
  totalCharacters: number
  charactersWithBounty: number
  percentage: number
}

export interface TopBounty {
  name: string
  bounty: number
  origin: string | null
  status: string | null
}

// Helper function to format bounty ranges
function formatBountyRange(min: number, max: number): string {
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${num / 1000000000}B`
    if (num >= 1000000) return `${num / 1000000}M`
    if (num >= 1000) return `${num / 1000}K`
    return num.toString()
  }

  if (max === Infinity) return `${formatNumber(min)}+`
  return `${formatNumber(min)}-${formatNumber(max)}`
}

/**
 * Get distribution of character bounties by ranges with power tier groupings
 * Returns stacked data with alive vs not alive counts
 */
export async function fetchBountyDistribution(): Promise<BountyRange[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('name, bounty, status')
      .not('bounty', 'is', null)
      .gt('bounty', 0)

    if (error) {
      logger.error('Error fetching bounty data:', error)
      return []
    }

    // Define bounty ranges with power tier labels
    const ranges = [
      { min: 0, max: 100000, powerTier: 'Cute Pirates', color: '#93c5fd' },
      {
        min: 100000,
        max: 1000000,
        powerTier: 'Fodder Pirates / Warrant Officer',
        color: '#60a5fa',
      },
      {
        min: 1000000,
        max: 100000000,
        powerTier: 'Common Pirates / Marines Commander',
        color: '#3b82f6',
      },
      {
        min: 100000000,
        max: 500000000,
        powerTier: 'Supernova / Commodore / Rear Admiral',
        color: '#8b5cf6',
      },
      {
        min: 500000000,
        max: 1000000000,
        powerTier: 'Shichibukai / Yonkou Members',
        color: '#ec4899',
      },
      {
        min: 1000000000,
        max: 3000000000,
        powerTier: 'Yonkou Commanders / Vice Admiral',
        color: '#f59e0b',
      },
      {
        min: 3000000000,
        max: 5000000000,
        powerTier: 'Yonkou / Admiral',
        color: '#ef4444',
      },
      {
        min: 5000000000,
        max: Infinity,
        powerTier: 'Legends',
        color: '#dc2626',
      },
    ]

    // Count characters in each range, separated by alive status
    const distribution: BountyRange[] = ranges.map((range) => {
      const charsInRange = data.filter(
        (char) => char.bounty >= range.min && char.bounty < range.max
      )

      const alive = charsInRange.filter(
        (char) => char.status === 'Alive'
      ).length
      const notAlive = charsInRange.filter(
        (char) => char.status !== 'Alive'
      ).length

      // Top 3 characters by bounty as examples
      const examples = [...charsInRange]
        .sort((a, b) => b.bounty - a.bounty)
        .slice(0, 3)
        .map((c) => ({ name: c.name, bounty: c.bounty }))

      return {
        range: formatBountyRange(range.min, range.max),
        count: charsInRange.length,
        color: range.color,
        powerTier: range.powerTier,
        alive,
        notAlive,
        examples,
      }
    })

    // Return all ranges to show complete power tier hierarchy
    return distribution
  } catch (error) {
    logger.error('Error in fetchBountyDistribution:', error)
    return []
  }
}

/**
 * Get statistics about characters with bounties
 */
export async function fetchBountyStats(): Promise<BountyStats> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return { totalCharacters: 0, charactersWithBounty: 0, percentage: 0 }
    }

    // Get total character count
    const { count: totalCharacters, error: totalError } = await supabase
      .from('character')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      logger.error('Error fetching total characters:', totalError)
      return { totalCharacters: 0, charactersWithBounty: 0, percentage: 0 }
    }

    // Get count of characters with bounty > 0
    const { count: charactersWithBounty, error: bountyError } = await supabase
      .from('character')
      .select('*', { count: 'exact', head: true })
      .not('bounty', 'is', null)
      .gt('bounty', 0)

    if (bountyError) {
      logger.error('Error fetching characters with bounty:', bountyError)
      return {
        totalCharacters: totalCharacters || 0,
        charactersWithBounty: 0,
        percentage: 0,
      }
    }

    const percentage = totalCharacters
      ? Math.round(((charactersWithBounty || 0) / totalCharacters) * 100 * 10) /
      10
      : 0

    return {
      totalCharacters: totalCharacters || 0,
      charactersWithBounty: charactersWithBounty || 0,
      percentage,
    }
  } catch (error) {
    logger.error('Error in fetchBountyStats:', error)
    return { totalCharacters: 0, charactersWithBounty: 0, percentage: 0 }
  }
}

/**
 * Get top characters by bounty
 * @param limit - Number of top bounties to return
 * @param aliveOnly - If true, only include characters with status 'Alive'
 */
export async function fetchTopBounties(
  limit: number = 10,
  aliveOnly: boolean = false
): Promise<TopBounty[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('character')
      .select('name, bounty, origin, status')
      .not('bounty', 'is', null)
      .gt('bounty', 0)

    if (aliveOnly) {
      query = query.eq('status', 'Alive')
    }

    const { data, error } = await query
      .order('bounty', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching top bounties:', error)
      return []
    }

    return data.map((char) => ({
      name: char.name || 'Unknown',
      bounty: char.bounty || 0,
      origin: char.origin,
      status: char.status,
    }))
  } catch (error) {
    logger.error('Error in fetchTopBounties:', error)
    return []
  }
}
