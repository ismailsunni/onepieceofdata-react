export type ChangelogCategory = 'feature' | 'improvement' | 'fix' | 'chore'

export interface ChangelogEntry {
  /** ISO date (YYYY-MM-DD) the change shipped on */
  date: string
  /** Short headline shown as the entry title */
  title: string
  /** Optional longer description for context */
  description?: string
  /** Bucket used for the colored badge in the UI */
  category?: ChangelogCategory
}

/**
 * Append new entries to the top. Sorting by date is handled at render time,
 * so the file order is purely for readability.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-05-02',
    title: 'Changelog page',
    description:
      'Added a public changelog grouped by date, linked from the About page.',
    category: 'feature',
  },
  {
    date: '2026-05-01',
    title: 'Character Network marked as beta',
    description: 'Surfaced the beta state of the Character Network in the nav.',
    category: 'improvement',
  },
  {
    date: '2026-04-30',
    title: 'Home page shows latest covered chapter and volume',
    category: 'feature',
  },
  {
    date: '2026-04-30',
    title: 'Character detail: relationships and merged affiliations',
    description:
      'Merged affiliations and occupations into one section and added a relationships block (Fought / Ally / Enemy pills).',
    category: 'feature',
  },
  {
    date: '2026-04-30',
    title: 'Chapter detail: debut arc and appearance badges',
    description:
      'Show debut arc in the First Appearance column plus chapter position and appearance badges.',
    category: 'feature',
  },
  {
    date: '2026-04-30',
    title: 'Story Graph: direction-aware relation labels',
    category: 'improvement',
  },
  {
    date: '2026-04-30',
    title: 'Track HashRouter route changes in Umami',
    description:
      'SPA route changes are now reported manually so analytics matches real navigation.',
    category: 'chore',
  },
  {
    date: '2026-04-27',
    title: 'Story Graph page',
    description:
      'New analytics page with an interactive character relationship visualization, saga/arc filters, sortable edge table, mini-profiles, and cross-links to character detail pages.',
    category: 'feature',
  },
  {
    date: '2026-04-25',
    title: 'Devil Fruits merged into characters',
    description:
      'Devil fruit and haki columns added to the characters table and the compare view.',
    category: 'feature',
  },
  {
    date: '2026-04-25',
    title: 'Character table state persists across reloads',
    category: 'improvement',
  },
  {
    date: '2026-04-25',
    title: 'Column visibility control on characters table',
    category: 'feature',
  },
  {
    date: '2026-04-24',
    title: 'Character occupations page and detail view',
    category: 'feature',
  },
  {
    date: '2026-04-23',
    title: 'Chapter release predictor moved to calendar',
    description:
      'Jump issue forecast now overlays the release calendar and predicts the next chapters.',
    category: 'feature',
  },
  {
    date: '2026-04-22',
    title: 'Who Am I and Guess the Character refinements',
    description:
      'Tiered difficulty for Who Am I, 2x2 quiz options, and pure speed-based scoring with rebalanced ranks.',
    category: 'improvement',
  },
  {
    date: '2026-04-21',
    title: 'Game result screens reveal bio and duration',
    category: 'feature',
  },
]
