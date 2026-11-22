import { queryOptions } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { fetchAffiliationsByCharacter } from '../services/affiliationService'
import { fetchDevilFruitsByCharacter } from '../services/devilFruitService'
import { fetchOccupationsByCharacter } from '../services/occupationService'
import { Character } from '../types/character'
import { logger } from '../utils/logger'

async function fetchCharacterById(id: string): Promise<Character | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('character')
    .select('*')
    .eq('id', id)
    .single()
  if (error) logger.error('Error fetching character:', error)
  return data
}

// Shared by CharacterDetailPage and the build-time prefetch
export const characterQueries = (id: string) => ({
  character: queryOptions({
    queryKey: ['character', id],
    queryFn: () => fetchCharacterById(id),
  }),
  occupations: queryOptions({
    queryKey: ['character-occupations', id],
    queryFn: () => fetchOccupationsByCharacter(id),
    staleTime: 10 * 60 * 1000,
  }),
  affiliations: queryOptions({
    queryKey: ['character-affiliations', id],
    queryFn: () => fetchAffiliationsByCharacter(id),
  }),
  devilFruits: queryOptions({
    queryKey: ['character-devil-fruits', id],
    queryFn: () => fetchDevilFruitsByCharacter(id),
  }),
})
