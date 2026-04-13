import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn() },
}))

import { supabase } from '../supabase'
import { fetchDatabaseStats } from '../statsService'

const defaultStats = {
  chapters: 0,
  volumes: 0,
  arcs: 0,
  sagas: 0,
  characters: 0,
  affiliations: 0,
  totalPages: 0,
  publicationSpan: 'Unknown',
}

function buildCountChain(count: number) {
  return {
    select: vi.fn().mockResolvedValue({ count, error: null }),
  }
}

function buildDataChain(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

function buildPagesChain(data: unknown) {
  return {
    select: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

describe('fetchDatabaseStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns correct counts and computed fields', async () => {
    let callIndex = 0
    vi.mocked(supabase!.from).mockImplementation(() => {
      callIndex++
      // Calls 1-5: count queries (chapter, volume, arc, saga, character)
      if (callIndex <= 5) return buildCountChain(callIndex * 10) as never
      // Call 6: character_affiliation group_name select (for distinct count)
      if (callIndex === 6)
        return buildPagesChain([
          { group_name: 'Straw Hat Pirates' },
          { group_name: 'Straw Hat Pirates' },
          { group_name: 'Revolutionary Army' },
          { group_name: null },
        ]) as never
      // Call 7: num_page select for totalPages
      if (callIndex === 7) return buildPagesChain([{ num_page: 20 }, { num_page: 30 }]) as never
      // Call 8: first chapter date
      if (callIndex === 8) return buildDataChain({ date: '1997-07-19' }) as never
      // Call 9: last chapter date
      return buildDataChain({ date: '2024-01-01' }) as never
    })

    const result = await fetchDatabaseStats()

    expect(result.chapters).toBe(10)
    expect(result.volumes).toBe(20)
    expect(result.arcs).toBe(30)
    expect(result.sagas).toBe(40)
    expect(result.characters).toBe(50)
    expect(result.affiliations).toBe(2) // distinct group_name values (nulls filtered)
    expect(result.totalPages).toBe(50) // 20 + 30
    expect(result.publicationSpan).toMatch(/\d+/) // a number (days)
    expect(result.publicationSpan).not.toBe('Unknown')
  })

  it('returns publicationSpan "Unknown" when dates are missing', async () => {
    let callIndex = 0
    vi.mocked(supabase!.from).mockImplementation(() => {
      callIndex++
      if (callIndex <= 5) return buildCountChain(0) as never
      if (callIndex === 6) return buildPagesChain([]) as never
      if (callIndex === 7) return buildPagesChain([]) as never
      return buildDataChain(null) as never
    })

    const result = await fetchDatabaseStats()

    expect(result.publicationSpan).toBe('Unknown')
  })

  it('returns zero totalPages when chapter data is empty', async () => {
    let callIndex = 0
    vi.mocked(supabase!.from).mockImplementation(() => {
      callIndex++
      if (callIndex <= 5) return buildCountChain(0) as never
      if (callIndex === 6) return buildPagesChain([]) as never
      if (callIndex === 7) return buildPagesChain([]) as never
      return buildDataChain(null) as never
    })

    const result = await fetchDatabaseStats()

    expect(result.totalPages).toBe(0)
  })

  it('returns default stats on thrown error', async () => {
    vi.mocked(supabase!.from).mockImplementation(() => {
      throw new Error('Network error')
    })

    expect(await fetchDatabaseStats()).toEqual(defaultStats)
  })
})
