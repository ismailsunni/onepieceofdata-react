import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn() },
}))

import { supabase } from '../supabase'
import { searchAll } from '../searchService'

const emptyResult = { characters: [], arcs: [], sagas: [], chapters: [], volumes: [] }

function mockSearch(results: { characters?: unknown[]; arcs?: unknown[]; sagas?: unknown[]; chapters?: unknown[]; volumes?: unknown[] } = {}) {
  const tables = ['character', 'arc', 'saga', 'chapter', 'volume'] as const
  const dataMap: Record<string, unknown[]> = {
    character: results.characters ?? [],
    arc: results.arcs ?? [],
    saga: results.sagas ?? [],
    chapter: results.chapters ?? [],
    volume: results.volumes ?? [],
  }

  vi.mocked(supabase!.from).mockImplementation((table: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: dataMap[table] ?? [], error: null }),
    }
    return chain as never
  })

  return tables
}

describe('searchAll', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty result for empty query', async () => {
    expect(await searchAll('')).toEqual(emptyResult)
    expect(await searchAll('   ')).toEqual(emptyResult)
    expect(supabase!.from).not.toHaveBeenCalled()
  })

  it('returns matched results across all entities', async () => {
    mockSearch({
      characters: [{ character_id: 1, name: 'Luffy' }],
      arcs: [{ arc_id: 1, title: 'Luffy Arc' }],
    })

    const result = await searchAll('Luffy')

    expect(result.characters).toHaveLength(1)
    expect(result.arcs).toHaveLength(1)
    expect(result.sagas).toEqual([])
    expect(result.chapters).toEqual([])
    expect(result.volumes).toEqual([])
  })

  it('returns all empty arrays on network error', async () => {
    vi.mocked(supabase!.from).mockImplementation(() => {
      throw new Error('Network error')
    })
    expect(await searchAll('Luffy')).toEqual(emptyResult)
  })

  it('uses ilike with wildcard wrapping the query', async () => {
    const chains: ReturnType<typeof vi.fn>[] = []
    vi.mocked(supabase!.from).mockImplementation(() => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      chains.push(chain.ilike)
      return chain as never
    })

    await searchAll('Zoro')

    chains.forEach((ilikeMock) => {
      expect(ilikeMock).toHaveBeenCalledWith(expect.any(String), '%Zoro%')
    })
  })
})
