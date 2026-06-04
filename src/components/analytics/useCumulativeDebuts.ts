import { useMemo, useState } from 'react'
import {
  computeCumulativeDebutSeries,
  computeDebutStats,
  type DebutGranularity,
} from '../../services/analyticsService'
import type { Character } from '../../types/character'
import type { Arc, Saga } from '../../types/arc'

/**
 * Shared state + derived series for the cumulative-debut chart. Used by both the
 * main analytics section and the embed renderer so the logic stays in one place.
 *
 * The per-character stats are memoized once (independent of the controls) and the
 * series is recomputed only when granularity / filter change.
 */
export function useCumulativeDebuts(
  characters: Character[],
  arcs: Arc[],
  sagas: Saga[]
) {
  const [granularity, setGranularity] = useState<DebutGranularity>('arc')
  const [filterOn, setFilterOn] = useState(false)

  const dataset = useMemo(
    () => computeDebutStats(characters, arcs, sagas),
    [characters, arcs, sagas]
  )

  const series = useMemo(
    () =>
      computeCumulativeDebutSeries(dataset, arcs, sagas, granularity, filterOn),
    [dataset, arcs, sagas, granularity, filterOn]
  )

  return { granularity, setGranularity, filterOn, setFilterOn, series }
}
