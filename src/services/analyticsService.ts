import { supabase } from './supabase'
import { Saga } from '../types/arc'

export interface BountyRange {
  range: string
  count: number
  color: string
  powerTier: string // Store the power tier name separately
  alive: number // Count of alive characters
  notAlive: number // Count of deceased/unknown characters
}

export interface BountyStats {
  totalCharacters: number
  charactersWithBounty: number
  percentage: number
}

export interface StatusDistribution {
  status: string
  count: number
  color: string
  [key: string]: string | number // Index signature for recharts compatibility
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

export interface TopBounty {
  name: string
  bounty: number
  origin: string | null
}

export interface AppearanceData {
  chapterRange: string
  characterCount: number
}

export interface SagaAppearanceData {
  sagaName: string
  characterCount: number
  sagaOrder: number
}

export interface SagaAppearanceCountData {
  sagaCount: string // "1 saga", "2 sagas", etc.
  characterCount: number
}

/**
 * Get distribution of character bounties by ranges with power tier groupings
 * Returns stacked data with alive vs not alive counts
 */
export async function fetchBountyDistribution(): Promise<BountyRange[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('bounty, status')
      .not('bounty', 'is', null)
      .gt('bounty', 0)

    if (error) {
      console.error('Error fetching bounty data:', error)
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

      return {
        range: formatBountyRange(range.min, range.max),
        count: charsInRange.length,
        color: range.color,
        powerTier: range.powerTier,
        alive,
        notAlive,
      }
    })

    // Return all ranges to show complete power tier hierarchy
    return distribution
  } catch (error) {
    console.error('Error in fetchBountyDistribution:', error)
    return []
  }
}

/**
 * Get statistics about characters with bounties
 */
export async function fetchBountyStats(): Promise<BountyStats> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return { totalCharacters: 0, charactersWithBounty: 0, percentage: 0 }
    }

    // Get total character count
    const { count: totalCharacters, error: totalError } = await supabase
      .from('character')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('Error fetching total characters:', totalError)
      return { totalCharacters: 0, charactersWithBounty: 0, percentage: 0 }
    }

    // Get count of characters with bounty > 0
    const { count: charactersWithBounty, error: bountyError } = await supabase
      .from('character')
      .select('*', { count: 'exact', head: true })
      .not('bounty', 'is', null)
      .gt('bounty', 0)

    if (bountyError) {
      console.error('Error fetching characters with bounty:', bountyError)
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
    console.error('Error in fetchBountyStats:', error)
    return { totalCharacters: 0, charactersWithBounty: 0, percentage: 0 }
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
 * Get character appearance distribution by saga
 * Shows how many characters first appeared in each saga
 */
export async function fetchSagaAppearanceDistribution(): Promise<
  SagaAppearanceData[]
> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    // Fetch all sagas
    const { data: sagas, error: sagasError } = await supabase
      .from('saga')
      .select<'*', Saga>('*')
      .order('start_chapter', { ascending: true })

    if (sagasError) {
      console.error('Error fetching sagas:', sagasError)
      return []
    }

    // Fetch all characters with their first appearance
    const { data: characters, error: charactersError } = await supabase
      .from('character')
      .select('first_appearance')
      .not('first_appearance', 'is', null)

    if (charactersError) {
      console.error('Error fetching characters:', charactersError)
      return []
    }

    // Count characters that first appeared in each saga
    const distribution: SagaAppearanceData[] = sagas.map((saga, index) => {
      const count = characters.filter(
        (char) =>
          char.first_appearance >= saga.start_chapter &&
          char.first_appearance <= saga.end_chapter
      ).length

      return {
        sagaName: saga.title,
        characterCount: count,
        sagaOrder: index + 1,
      }
    })

    return distribution
  } catch (error) {
    console.error('Error in fetchSagaAppearanceDistribution:', error)
    return []
  }
}

/**
 * Get character saga appearance count distribution
 * Shows how many characters appear in 1 saga, 2 sagas, 3 sagas, etc.
 */
export async function fetchSagaAppearanceCountDistribution(): Promise<SagaAppearanceCountData[]> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    // Fetch all sagas
    const { data: sagas, error: sagasError } = await supabase
      .from('saga')
      .select<'*', Saga>('*')
      .order('start_chapter', { ascending: true })

    if (sagasError) {
      console.error('Error fetching sagas:', sagasError)
      return []
    }

    // Fetch all characters with their chapter data
    const { data: characters, error: charactersError } = await supabase
      .from('character')
      .select('name, first_appearance, last_appearance')
      .not('first_appearance', 'is', null)

    if (charactersError) {
      console.error('Error fetching characters:', charactersError)
      return []
    }

    // For each character, count how many sagas they appear in
    const sagaCountMap = new Map<number, number>() // saga count -> character count

    characters.forEach((char) => {
      let sagaCount = 0
      
      sagas.forEach((saga) => {
        // Check if character appears in this saga
        const firstInRange = char.first_appearance <= saga.end_chapter
        const lastInRange = !char.last_appearance || char.last_appearance >= saga.start_chapter
        
        if (firstInRange && lastInRange) {
          sagaCount++
        }
      })

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
    console.error('Error in fetchSagaAppearanceCountDistribution:', error)
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
