import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn() },
}))

import { supabase } from '../supabase'
import {
  fetchAffiliationsByCharacter,
  fetchAllAffiliations,
} from '../affiliationService'

function mockChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  }
  vi.mocked(supabase!.from).mockReturnValue(chain as never)
  return chain
}

describe('fetchAffiliationsByCharacter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns affiliations for a given character', async () => {
    const rows = [
      {
        character_id: 'luffy',
        group_name: 'Straw Hat Pirates',
        sub_group: null,
        status: 'current',
      },
      {
        character_id: 'luffy',
        group_name: 'Worst Generation',
        sub_group: null,
        status: 'current',
      },
    ]
    const chain = mockChain(rows)

    const result = await fetchAffiliationsByCharacter('luffy')

    expect(result).toEqual(rows)
    expect(supabase!.from).toHaveBeenCalledWith('character_affiliation')
    expect(chain.eq).toHaveBeenCalledWith('character_id', 'luffy')
  })

  it('returns empty array when data is null', async () => {
    mockChain(null)
    expect(await fetchAffiliationsByCharacter('unknown')).toEqual([])
  })

  it('returns empty array on Supabase error', async () => {
    mockChain(null, { message: 'DB error' })
    expect(await fetchAffiliationsByCharacter('luffy')).toEqual([])
  })

  it('returns empty array when query throws', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(new Error('Network error')),
    }
    vi.mocked(supabase!.from).mockReturnValue(chain as never)
    expect(await fetchAffiliationsByCharacter('luffy')).toEqual([])
  })
})

describe('fetchAllAffiliations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns all affiliations on success', async () => {
    const rows = [
      {
        character_id: 'luffy',
        group_name: 'Straw Hat Pirates',
        sub_group: null,
        status: 'current',
      },
      {
        character_id: 'zoro',
        group_name: 'Straw Hat Pirates',
        sub_group: null,
        status: 'current',
      },
      {
        character_id: 'crocodile',
        group_name: 'Baroque Works',
        sub_group: 'Officer Agents',
        status: 'former',
      },
    ]
    mockChain(rows)

    const result = await fetchAllAffiliations()

    expect(result).toEqual(rows)
    expect(supabase!.from).toHaveBeenCalledWith('character_affiliation')
  })

  it('returns empty array when data is null', async () => {
    mockChain(null)
    expect(await fetchAllAffiliations()).toEqual([])
  })

  it('returns empty array on Supabase error', async () => {
    mockChain(null, { message: 'DB error' })
    expect(await fetchAllAffiliations()).toEqual([])
  })

  it('returns empty array when query throws', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(new Error('Network error')),
    }
    vi.mocked(supabase!.from).mockReturnValue(chain as never)
    expect(await fetchAllAffiliations()).toEqual([])
  })
})
