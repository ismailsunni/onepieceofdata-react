/**
 * Pretty-print relation and node-type slugs from the story graph.
 *
 * The graph stores typed relations as snake_case slugs (e.g. `member_of_crew`)
 * for stability across the data pipeline. These helpers turn them into
 * UI-friendly labels.
 */

const RELATION_LABELS: Record<string, string> = {
  ally_of: 'Ally of',
  enemy_of: 'Enemy of',
  fought: 'Fought',
  defeated_by: 'Defeated by',
  member_of_crew: 'Member of',
  captain_of: 'Captain of',
  affiliated_with: 'Affiliated with',
  family_of: 'Family of',
  mentor_of: 'Mentor of',
  ate_devil_fruit: 'Ate',
  originates_from: 'Originates from',
  has_bounty_of: 'Has bounty of',
}

const NODE_TYPE_LABELS: Record<string, string> = {
  character: 'Character',
  crew: 'Crew',
  organization: 'Organization',
  saga: 'Saga',
  arc: 'Arc',
  devil_fruit: 'Devil Fruit',
  location: 'Location',
}

/** Title-case a snake_case slug as a fallback when no label is mapped. */
function titleCase(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatRelation(rel: string): string {
  return RELATION_LABELS[rel] ?? titleCase(rel)
}

export function formatNodeType(type: string): string {
  return NODE_TYPE_LABELS[type] ?? titleCase(type)
}
