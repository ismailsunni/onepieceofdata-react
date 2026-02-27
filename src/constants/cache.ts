const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** React Query cache durations */
export const CACHE = {
  /** Default stale time: 5 minutes (general data) */
  DEFAULT_STALE: 5 * MINUTE,
  /** Default gc time: 30 minutes */
  DEFAULT_GC: 30 * MINUTE,
  /** Reference data that rarely changes (arcs, sagas, volumes) */
  REFERENCE_STALE: DAY,
  REFERENCE_GC: 7 * DAY,
  /** Analytics / aggregated data */
  ANALYTICS_STALE: 15 * MINUTE,
  ANALYTICS_GC: HOUR,
} as const
