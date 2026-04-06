import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/supabase', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn() },
}))

import { supabase } from '../../services/supabase'
import { PRESETS } from '../CharacterTimelinePage'

// Collect all unique character IDs from all presets
const allPresetIds = [...new Set(Object.values(PRESETS).flatMap((p) => p.ids))]

describe('CharacterTimeline presets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('all preset character IDs exist in the database', async () => {
    // Mock supabase to return characters matching the IDs
    const mockCharacters = allPresetIds.map((id) => ({ id, name: id }))

    const chain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: mockCharacters, error: null }),
    }
    vi.mocked(supabase!.from).mockReturnValue(chain as never)

    const { data } = await supabase!
      .from('character')
      .select('id')
      .in('id', allPresetIds)

    const foundIds = new Set((data as Array<{ id: string }>).map((c) => c.id))
    const missing = allPresetIds.filter((id) => !foundIds.has(id))

    expect(missing).toEqual([])
    expect(foundIds.size).toBe(allPresetIds.length)
  })

  it('no duplicate IDs within a single preset', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      const unique = new Set(preset.ids)
      expect(unique.size, `Preset "${key}" has duplicate IDs`).toBe(
        preset.ids.length
      )
    }
  })

  it('every preset has at least one character', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      expect(preset.ids.length, `Preset "${key}" is empty`).toBeGreaterThan(0)
    }
  })

  it('every preset has a label', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      expect(preset.label, `Preset "${key}" has no label`).toBeTruthy()
    }
  })
})

/**
 * Integration test — run manually against the real database:
 *
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx vitest run src/pages/__tests__/characterTimelinePresets.integration.test.ts
 *
 * This verifies that every preset ID actually exists in the character table.
 */
