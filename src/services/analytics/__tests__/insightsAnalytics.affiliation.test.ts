import { describe, it, expect } from 'vitest'
import { CharacterAffiliation } from '../../../types/affiliation'
import { computeLargestGroups, computeCrewLoyalty } from '../insightsAnalytics'

// ── Helper to build mock affiliations ──────────────────────────────────────

function aff(
  character_id: string,
  group_name: string,
  status: string,
  sub_group: string | null = null
): CharacterAffiliation {
  return { character_id, group_name, sub_group, status }
}

// ── computeLargestGroups ───────────────────────────────────────────────────

describe('computeLargestGroups', () => {
  it('returns groups sorted by total members descending', () => {
    const data: CharacterAffiliation[] = [
      aff('luffy', 'Straw Hat Pirates', 'current'),
      aff('zoro', 'Straw Hat Pirates', 'current'),
      aff('nami', 'Straw Hat Pirates', 'current'),
      aff('crocodile', 'Baroque Works', 'former'),
      aff('robin', 'Baroque Works', 'former'),
    ]

    const result = computeLargestGroups(data)

    expect(result[0].groupName).toBe('Straw Hat Pirates')
    expect(result[0].totalMembers).toBe(3)
    expect(result[1].groupName).toBe('Baroque Works')
    expect(result[1].totalMembers).toBe(2)
  })

  it('counts current and former members correctly', () => {
    const data: CharacterAffiliation[] = [
      aff('luffy', 'Straw Hat Pirates', 'current'),
      aff('zoro', 'Straw Hat Pirates', 'current'),
      aff('vivi', 'Straw Hat Pirates', 'former'),
      aff('pudding', 'Straw Hat Pirates', 'defected'),
    ]

    const result = computeLargestGroups(data)
    const sh = result.find((g) => g.groupName === 'Straw Hat Pirates')!

    expect(sh.totalMembers).toBe(4)
    expect(sh.currentMembers).toBe(2)
    expect(sh.formerMembers).toBe(2) // former + defected both count as former
  })

  it('returns empty array for empty input', () => {
    expect(computeLargestGroups([])).toEqual([])
  })

  it('limits output to 30 groups', () => {
    // Create 35 groups with one member each
    const data: CharacterAffiliation[] = Array.from({ length: 35 }, (_, i) =>
      aff(`char_${i}`, `Group_${i}`, 'current')
    )

    const result = computeLargestGroups(data)
    expect(result.length).toBe(30)
  })

  it('handles members with unknown statuses', () => {
    const data: CharacterAffiliation[] = [
      aff('char1', 'Marines', 'current'),
      aff('char2', 'Marines', 'ally'),
      aff('char3', 'Marines', 'deceased'),
    ]

    const result = computeLargestGroups(data)
    const marines = result.find((g) => g.groupName === 'Marines')!

    expect(marines.totalMembers).toBe(3)
    expect(marines.currentMembers).toBe(1)
    // Only 'former' and 'defected' count as formerMembers
    expect(marines.formerMembers).toBe(0)
  })
})

// ── computeCrewLoyalty ─────────────────────────────────────────────────────

describe('computeCrewLoyalty', () => {
  it('returns groups with 5+ members sorted by total descending', () => {
    const data: CharacterAffiliation[] = [
      // Straw Hats: 6 members
      aff('luffy', 'Straw Hat Pirates', 'current'),
      aff('zoro', 'Straw Hat Pirates', 'current'),
      aff('nami', 'Straw Hat Pirates', 'current'),
      aff('sanji', 'Straw Hat Pirates', 'current'),
      aff('usopp', 'Straw Hat Pirates', 'current'),
      aff('robin', 'Straw Hat Pirates', 'current'),
      // Marines: 5 members
      aff('garp', 'Marines', 'current'),
      aff('sengoku', 'Marines', 'former'),
      aff('aokiji', 'Marines', 'defected'),
      aff('smoker', 'Marines', 'current'),
      aff('coby', 'Marines', 'current'),
      // Small group: 2 members (should be excluded)
      aff('ace', 'Spade Pirates', 'former'),
      aff('deuce', 'Spade Pirates', 'former'),
    ]

    const result = computeCrewLoyalty(data)

    expect(result.length).toBe(2)
    expect(result[0].groupName).toBe('Straw Hat Pirates')
    expect(result[1].groupName).toBe('Marines')
    // Spade Pirates excluded (only 2 members)
    expect(result.find((g) => g.groupName === 'Spade Pirates')).toBeUndefined()
  })

  it('calculates retention rate correctly', () => {
    const data: CharacterAffiliation[] = [
      aff('a', 'Marines', 'current'),
      aff('b', 'Marines', 'current'),
      aff('c', 'Marines', 'current'),
      aff('d', 'Marines', 'former'),
      aff('e', 'Marines', 'defected'),
    ]

    const result = computeCrewLoyalty(data)
    const marines = result[0]

    expect(marines.current).toBe(3)
    expect(marines.former).toBe(1)
    expect(marines.defected).toBe(1)
    expect(marines.other).toBe(0)
    expect(marines.total).toBe(5)
    // retentionRate = round((3/5) * 1000) / 10 = 60.0
    expect(marines.retentionRate).toBe(60)
  })

  it('counts "other" statuses correctly', () => {
    const data: CharacterAffiliation[] = [
      aff('a', 'Group', 'current'),
      aff('b', 'Group', 'former'),
      aff('c', 'Group', 'defected'),
      aff('d', 'Group', 'ally'),
      aff('e', 'Group', 'deceased'),
    ]

    const result = computeCrewLoyalty(data)
    const g = result[0]

    expect(g.current).toBe(1)
    expect(g.former).toBe(1)
    expect(g.defected).toBe(1)
    expect(g.other).toBe(2) // ally and deceased are "other"
    expect(g.total).toBe(5)
    // retentionRate = round((1/5) * 1000) / 10 = 20.0
    expect(g.retentionRate).toBe(20)
  })

  it('returns empty array for empty input', () => {
    expect(computeCrewLoyalty([])).toEqual([])
  })

  it('filters out groups with fewer than 5 members', () => {
    const data: CharacterAffiliation[] = [
      aff('a', 'Small Group', 'current'),
      aff('b', 'Small Group', 'current'),
      aff('c', 'Small Group', 'current'),
      aff('d', 'Small Group', 'current'),
      // Only 4 members, should be excluded
    ]

    expect(computeCrewLoyalty(data)).toEqual([])
  })

  it('limits output to 25 groups', () => {
    // Create 30 groups with exactly 5 members each
    const data: CharacterAffiliation[] = []
    for (let g = 0; g < 30; g++) {
      for (let m = 0; m < 5; m++) {
        data.push(aff(`char_${g}_${m}`, `Group_${g}`, 'current'))
      }
    }

    const result = computeCrewLoyalty(data)
    expect(result.length).toBe(25)
  })

  it('handles 100% retention rate', () => {
    const data: CharacterAffiliation[] = [
      aff('a', 'Loyal Crew', 'current'),
      aff('b', 'Loyal Crew', 'current'),
      aff('c', 'Loyal Crew', 'current'),
      aff('d', 'Loyal Crew', 'current'),
      aff('e', 'Loyal Crew', 'current'),
    ]

    const result = computeCrewLoyalty(data)
    expect(result[0].retentionRate).toBe(100)
  })

  it('handles 0% retention rate', () => {
    const data: CharacterAffiliation[] = [
      aff('a', 'Disbanded Crew', 'former'),
      aff('b', 'Disbanded Crew', 'former'),
      aff('c', 'Disbanded Crew', 'defected'),
      aff('d', 'Disbanded Crew', 'defected'),
      aff('e', 'Disbanded Crew', 'former'),
    ]

    const result = computeCrewLoyalty(data)
    expect(result[0].retentionRate).toBe(0)
  })
})
