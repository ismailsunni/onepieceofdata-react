import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn() },
}))

import { supabase } from '../supabase'
import { fetchCharacters } from '../characterService'

function mockChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  }
  vi.mocked(supabase!.from).mockReturnValue(chain as never)
}

describe('fetchCharacters', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns characters on success', async () => {
    const rows = [{ character_id: 1, name: 'Luffy' }]
    mockChain(rows)

    expect(await fetchCharacters()).toEqual(rows)
    expect(supabase!.from).toHaveBeenCalledWith('character')
  })

  it('returns empty array when data is null', async () => {
    mockChain(null)
    expect(await fetchCharacters()).toEqual([])
  })

  it('returns empty array on Supabase error', async () => {
    mockChain(null, { message: 'DB error' })
    expect(await fetchCharacters()).toEqual([])
  })

  it('returns empty array when query throws', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(new Error('Network error')),
    }
    vi.mocked(supabase!.from).mockReturnValue(chain as never)
    expect(await fetchCharacters()).toEqual([])
  })
})
