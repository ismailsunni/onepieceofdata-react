export interface CharacterPollEntry {
  poll_id: string
  rank: number
  name: string
  points: number | null
  character_id: string | null
  is_variant: boolean
  site_face_id: string | null
  image_url: string | null
  image_file: string | null
}

export interface PollEdition {
  id: string
  label: string
  shortLabel: string
  year: number
  /** Ranks up to this position have published vote counts. */
  pointsUpTo: number
  siteUrl?: string
}

/**
 * Editions present in `character_poll`. The table has no metadata table, so the
 * human-readable labels live here.
 */
export const POLL_EDITIONS: PollEdition[] = [
  {
    id: 'wt100_2026',
    label: 'World Top 100 — 2026',
    shortLabel: '2026',
    year: 2026,
    pointsUpTo: 10,
    siteUrl: 'https://onepiecewt100-2026.com',
  },
  {
    id: 'wt100_2021',
    label: 'World Top 100 — 2021',
    shortLabel: '2021',
    year: 2021,
    pointsUpTo: 100,
  },
]

export const LATEST_POLL_ID = 'wt100_2026'
export const PREVIOUS_POLL_ID = 'wt100_2021'
