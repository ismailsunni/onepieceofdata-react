import { supabase } from './supabase'

export interface BountyRange {
  range: string
  count: number
  color: string
}

export interface StatusDistribution {
  status: string
  count: number
  color: string
  [key: string]: string | number // Index signature for recharts compatibility
}

export interface TopBounty {
  name: string
  bounty: number
  origin: string | null
}

export interface AppearanceData {
  chapterRange: string
  characterCount: number
}

/**
 * Get distribution of character bounties by ranges
 * @param aliveOnly - If true, only include characters with status 'Alive'
 */
export async function fetchBountyDistribution(aliveOnly: boolean = false): Promise<BountyRange[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    let query = supabase
      .from('character')
      .select('bounty, status')
      .not('bounty', 'is', null)
      .gt('bounty', 0)

    if (aliveOnly) {
      query = query.eq('status', 'Alive')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching bounty data:', error)
      return []
    }

    // Define bounty ranges
    const ranges = [
      { min: 0, max: 50000000, label: '0-50M', color: '#3b82f6' },
      { min: 50000000, max: 100000000, label: '50-100M', color: '#8b5cf6' },
      { min: 100000000, max: 300000000, label: '100-300M', color: '#ec4899' },
      { min: 300000000, max: 500000000, label: '300-500M', color: '#f59e0b' },
      { min: 500000000, max: 1000000000, label: '500M-1B', color: '#ef4444' },
      { min: 1000000000, max: Infinity, label: '1B+', color: '#dc2626' },
    ]

    // Count characters in each range
    const distribution: BountyRange[] = ranges.map((range) => {
      const count = data.filter(
        (char) => char.bounty >= range.min && char.bounty < range.max
      ).length
      return {
        range: range.label,
        count,
        color: range.color,
      }
    })

    return distribution
  } catch (error) {
    console.error('Error in fetchBountyDistribution:', error)
    return []
  }
}

/**
 * Get distribution of character statuses (Alive, Deceased, Unknown)
 */
export async function fetchStatusDistribution(): Promise<StatusDistribution[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase.from('character').select('status')

    if (error) {
      console.error('Error fetching status data:', error)
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
    console.error('Error in fetchStatusDistribution:', error)
    return []
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
      console.error('Supabase client not initialized')
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
      console.error('Error fetching top bounties:', error)
      return []
    }

    return data.map((char) => ({
      name: char.name || 'Unknown',
      bounty: char.bounty || 0,
      origin: char.origin,
    }))
  } catch (error) {
    console.error('Error in fetchTopBounties:', error)
    return []
  }
}

/**
 * Get character appearance distribution over chapter ranges
 */
export async function fetchAppearanceDistribution(): Promise<AppearanceData[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('appearance_count')
      .not('appearance_count', 'is', null)
      .gt('appearance_count', 0)

    if (error) {
      console.error('Error fetching appearance data:', error)
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
    console.error('Error in fetchAppearanceDistribution:', error)
    return []
  }
}

/**
 * Get blood type distribution
 */
export async function fetchBloodTypeDistribution(): Promise<
  { bloodType: string; count: number }[]
> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('blood_type_group')
      .not('blood_type_group', 'is', null)

    if (error) {
      console.error('Error fetching blood type data:', error)
      return []
    }

    // Count each blood type
    const bloodTypeMap = new Map<string, number>()
    data.forEach((char) => {
      const bloodType = char.blood_type_group
      if (bloodType) {
        bloodTypeMap.set(bloodType, (bloodTypeMap.get(bloodType) || 0) + 1)
      }
    })

    // Convert to array and sort
    return Array.from(bloodTypeMap.entries())
      .map(([bloodType, count]) => ({ bloodType, count }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error in fetchBloodTypeDistribution:', error)
    return []
  }
}
