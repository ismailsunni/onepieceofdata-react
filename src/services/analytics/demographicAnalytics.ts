import { supabase } from '../supabase'
import { logger } from '../../utils/logger'

export interface OriginRegionData {
  region: string
  count: number
}

export interface CharacterBirthday {
  id: string
  name: string
  birth_date: string
  age: number | null
  status: string | null
}

export interface BirthdaysByDate {
  [date: string]: CharacterBirthday[] // date format: 'MM-DD'
}

/**
 * Get blood type distribution
 */
export async function fetchBloodTypeDistribution(): Promise<
  { bloodType: string; count: number }[]
> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('blood_type_group')
      .not('blood_type_group', 'is', null)

    if (error) {
      logger.error('Error fetching blood type data:', error)
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
    logger.error('Error in fetchBloodTypeDistribution:', error)
    return []
  }
}

/**
 * Get all character birthdays organized by date
 * Returns a map of date (MM-DD) to array of characters born on that date
 */
export async function fetchCharacterBirthdays(): Promise<BirthdaysByDate> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return {}
    }

    const { data, error } = await supabase
      .from('character')
      .select('id, name, birth_date, age, status')
      .not('birth_date', 'is', null)

    if (error) {
      logger.error('Error fetching birthday data:', error)
      return {}
    }

    // Organize birthdays by date (MM-DD format)
    const birthdayMap: BirthdaysByDate = {}

    data.forEach((char) => {
      if (!char.birth_date || !char.name || !char.id) return

      // Parse the birth_date (assuming format like "May 5" or "05-05")
      const dateKey = parseBirthDate(char.birth_date)
      if (!dateKey) return

      if (!birthdayMap[dateKey]) {
        birthdayMap[dateKey] = []
      }

      birthdayMap[dateKey].push({
        id: char.id,
        name: char.name,
        birth_date: char.birth_date,
        age: char.age,
        status: char.status,
      })
    })

    return birthdayMap
  } catch (error) {
    logger.error('Error in fetchCharacterBirthdays:', error)
    return {}
  }
}

/**
 * Parse birth date string to MM-DD format
 * Handles various formats like "May 5", "05-05", "5/5", etc.
 */
function parseBirthDate(birthDate: string): string | null {
  try {
    // Remove any leading/trailing whitespace
    const cleaned = birthDate.trim()

    // Try to match month name format (e.g., "May 5", "January 1")
    const monthNames = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ]

    const lowerCleaned = cleaned.toLowerCase()
    for (let i = 0; i < monthNames.length; i++) {
      if (lowerCleaned.startsWith(monthNames[i])) {
        // Extract day number
        const dayMatch = cleaned.match(/\d+/)
        if (dayMatch) {
          const month = String(i + 1).padStart(2, '0')
          const day = dayMatch[0].padStart(2, '0')
          return `${month}-${day}`
        }
      }
    }

    // Try numeric formats (MM-DD, M/D, etc.)
    const numericMatch = cleaned.match(/(\d{1,2})[-/](\d{1,2})/)
    if (numericMatch) {
      const month = numericMatch[1].padStart(2, '0')
      const day = numericMatch[2].padStart(2, '0')
      return `${month}-${day}`
    }

    return null
  } catch (error) {
    logger.error('Error parsing birth date:', birthDate, error)
    return null
  }
}

/**
 * Get distribution of characters by origin_region, sorted by count descending.
 * Excludes characters with null origin_region.
 */
export async function fetchOriginRegionDistribution(): Promise<
  OriginRegionData[]
> {
  try {
    if (!supabase) {
      logger.error('Supabase client not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('origin_region')
      .not('origin_region', 'is', null)

    if (error) {
      logger.error('Error fetching origin_region data:', error)
      return []
    }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      const region = row.origin_region as string
      counts[region] = (counts[region] || 0) + 1
    }

    return Object.entries(counts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    logger.error('Error in fetchOriginRegionDistribution:', error)
    return []
  }
}
