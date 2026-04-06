/**
 * Integration test that verifies all preset character IDs exist in the database.
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.
 * Skip if not available (e.g. CI without secrets).
 *
 * Run:
 *   npx vitest run src/pages/__tests__/characterTimelinePresets.integration.test.ts
 */
import { describe, it, expect } from 'vitest'
import { PRESETS } from '../CharacterTimelinePage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const allPresetIds = [...new Set(Object.values(PRESETS).flatMap((p) => p.ids))]

describe.skipIf(!supabaseUrl || !supabaseKey)(
  'CharacterTimeline presets (integration)',
  () => {
    it('all preset character IDs exist in the database', async () => {
      // Query character table for all preset IDs
      const idsParam = allPresetIds.map((id) => `"${id}"`).join(',')
      const url = `${supabaseUrl}/rest/v1/character?select=id&id=in.(${idsParam})`
      const response = await fetch(url, {
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
        },
      })

      expect(response.ok).toBe(true)
      const data: Array<{ id: string }> = await response.json()

      const foundIds = new Set(data.map((c) => c.id))
      const missing = allPresetIds.filter((id) => !foundIds.has(id))

      if (missing.length > 0) {
        console.error('Missing character IDs in database:', missing)
      }

      expect(missing).toEqual([])
      expect(foundIds.size).toBe(allPresetIds.length)
    })
  }
)
