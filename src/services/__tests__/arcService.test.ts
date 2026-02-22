import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn() },
}))

import { supabase } from '../supabase'
import { fetchArcs } from '../arcService'

function mockParallelQueries(arcsData: unknown, sagasData: unknown, arcsError = null, sagasError = null) {
  let callCount = 0
  vi.mocked(supabase!.from).mockImplementation(() => {
    callCount++
    const isArcs = callCount % 2 === 1
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue(
        isArcs
          ? { data: arcsData, error: arcsError }
          : { data: sagasData, error: sagasError }
      ),
    }
    return chain as never
  })
}

describe('fetchArcs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns transformed arcs matched with sagas by saga_id', async () => {
    const arcs = [
      { arc_id: 1, title: 'East Blue', start_chapter: 1, end_chapter: 100, saga_id: 10 },
    ]
    const sagas = [
      { saga_id: 10, title: 'East Blue Saga', start_chapter: 1, end_chapter: 217 },
    ]
    mockParallelQueries(arcs, sagas)

    const result = await fetchArcs()

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('East Blue')
    expect(result[0].saga).toEqual({ title: 'East Blue Saga' })
    expect(result[0].saga_id).toBe(10)
  })

  it('matches saga by chapter range when arc has no saga_id', async () => {
    const arcs = [
      { arc_id: 2, title: 'Alabasta', start_chapter: 155, end_chapter: 217, saga_id: null },
    ]
    const sagas = [
      { saga_id: 20, title: 'Alabasta Saga', start_chapter: 103, end_chapter: 217 },
    ]
    mockParallelQueries(arcs, sagas)

    const result = await fetchArcs()

    expect(result[0].saga_id).toBe(20)
    expect(result[0].saga).toEqual({ title: 'Alabasta Saga' })
  })

  it('returns arc with no saga when no match found', async () => {
    const arcs = [
      { arc_id: 3, title: 'Unknown Arc', start_chapter: 1000, end_chapter: 1050, saga_id: null },
    ]
    const sagas = [
      { saga_id: 1, title: 'Some Saga', start_chapter: 1, end_chapter: 100 },
    ]
    mockParallelQueries(arcs, sagas)

    const result = await fetchArcs()

    expect(result[0].saga).toBeUndefined()
    expect(result[0].saga_id).toBeNull()
  })

  it('returns empty array on arcs query error', async () => {
    mockParallelQueries(null, [], { message: 'arcs error' })
    expect(await fetchArcs()).toEqual([])
  })

  it('still returns arcs when sagas query errors', async () => {
    const arcs = [
      { arc_id: 1, title: 'East Blue', start_chapter: 1, end_chapter: 100, saga_id: null },
    ]
    mockParallelQueries(arcs, null, null, { message: 'sagas error' })

    const result = await fetchArcs()

    expect(result).toHaveLength(1)
    expect(result[0].saga).toBeUndefined()
  })

  it('returns empty array when query throws', async () => {
    vi.mocked(supabase!.from).mockImplementation(() => {
      throw new Error('Network error')
    })
    expect(await fetchArcs()).toEqual([])
  })
})
