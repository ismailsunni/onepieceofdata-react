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

export interface DirectionalRelation {
  /** Human-readable label written from the perspective of the *current* node. */
  label: string
  /**
   * Stable bucket key used for grouping. Asymmetric relations have a different
   * bucket per direction (e.g. defeated -> 'defeated' vs 'lost_to') so they
   * can be split into two sections; symmetric relations share one bucket.
   */
  bucket: string
}

/**
 * Format a relation from the perspective of one endpoint (the "current" node).
 *
 * For asymmetric relations the label changes by direction:
 *   - defeated_by outgoing  -> "Defeated by" (this node lost)
 *   - defeated_by incoming  -> "Defeated"    (this node won)
 *   - mentor_of  outgoing   -> "Mentor of"
 *   - mentor_of  incoming   -> "Apprentice of"
 *
 * For symmetric relations (ally, enemy, family, fought, ...) the label and
 * bucket are the same regardless of direction.
 */
export function formatRelationDirected(
  relation: string,
  isOutgoing: boolean
): DirectionalRelation {
  switch (relation) {
    case 'defeated_by':
      return isOutgoing
        ? { label: 'Defeated by', bucket: 'lost_to' }
        : { label: 'Defeated', bucket: 'defeated' }
    case 'mentor_of':
      return isOutgoing
        ? { label: 'Mentor of', bucket: 'mentor_of' }
        : { label: 'Apprentice of', bucket: 'apprentice_of' }
    case 'captain_of':
      return isOutgoing
        ? { label: 'Captain of', bucket: 'captain_of' }
        : { label: 'Captained by', bucket: 'captained_by' }
    default:
      return { label: formatRelation(relation), bucket: relation }
  }
}
