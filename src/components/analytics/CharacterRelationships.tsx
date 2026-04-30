import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchStoryGraph } from '../../services/storyGraphService'
import { GraphEdge, GraphNode } from '../../types/storyGraph'
import { formatRelationDirected } from '../../utils/formatRelation'

const MIN_CONFIDENCE = 0.7
const MAX_PER_GROUP = 12

/**
 * Sections shown on a character profile, listed in display order. Each section
 * pulls in items whose directional bucket (from formatRelationDirected) is
 * listed here. Asymmetric relations are split: e.g. "Defeats" pulls only the
 * `defeated` bucket (this character won), while "Defeated by" pulls `lost_to`
 * (this character lost).
 */
const GROUPS: { title: string; buckets: string[] }[] = [
  { title: 'Crew', buckets: ['member_of_crew', 'captain_of', 'captained_by'] },
  { title: 'Affiliations', buckets: ['affiliated_with'] },
  { title: 'Allies', buckets: ['ally_of'] },
  { title: 'Enemies', buckets: ['enemy_of'] },
  { title: 'Fought', buckets: ['fought'] },
  { title: 'Defeats (won)', buckets: ['defeated'] },
  { title: 'Defeated by (lost)', buckets: ['lost_to'] },
  { title: 'Family', buckets: ['family_of'] },
  { title: 'Mentor of', buckets: ['mentor_of'] },
  { title: 'Apprentice of', buckets: ['apprentice_of'] },
  {
    title: 'Origin & devil fruit',
    buckets: ['originates_from', 'ate_devil_fruit'],
  },
]

interface RelationItem {
  edge: GraphEdge
  /** The "other" node (not this character). */
  otherNode: GraphNode
  /** Whether this character is the subject of the edge (edge points outward). */
  isOutgoing: boolean
  /** Pre-computed directional label for this item ("Defeated", "Defeated by", ...). */
  label: string
  /** Pre-computed bucket key used to assign the item to a section. */
  bucket: string
}

interface RelationGroup {
  title: string
  items: RelationItem[]
}

export function CharacterRelationships({
  characterId,
  characterName,
}: {
  characterId: string
  characterName: string
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['story-graph'],
    queryFn: fetchStoryGraph,
    staleTime: 10 * 60 * 1000,
  })

  const groups = useMemo<RelationGroup[]>(() => {
    if (!data) return []

    const node = data.nodes.find(
      (n) => n.type === 'character' && n.source_id === characterId
    )
    if (!node) return []

    const nodesById = new Map<number, GraphNode>(
      data.nodes.map((n) => [n.id, n])
    )

    // Bucket items by their *directional* bucket key, so wins and losses
    // (etc.) split into separate sections.
    const byBucket = new Map<string, RelationItem[]>()
    for (const e of data.edges) {
      if (e.confidence < MIN_CONFIDENCE) continue
      let otherId: number | null = null
      let isOutgoing = false
      if (e.subject_id === node.id) {
        otherId = e.object_id
        isOutgoing = true
      } else if (e.object_id === node.id) {
        otherId = e.subject_id
        isOutgoing = false
      } else {
        continue
      }
      const otherNode = nodesById.get(otherId)
      if (!otherNode) continue
      const directional = formatRelationDirected(e.relation, isOutgoing)
      const list = byBucket.get(directional.bucket) ?? []
      list.push({
        edge: e,
        otherNode,
        isOutgoing,
        label: directional.label,
        bucket: directional.bucket,
      })
      byBucket.set(directional.bucket, list)
    }

    // Assemble sections in defined order, sorted by confidence DESC,
    // deduped by other-node id within a section.
    const out: RelationGroup[] = []
    for (const g of GROUPS) {
      const merged: RelationItem[] = []
      const seenOtherIds = new Set<number>()
      for (const bucket of g.buckets) {
        for (const it of byBucket.get(bucket) ?? []) {
          if (seenOtherIds.has(it.otherNode.id)) continue
          seenOtherIds.add(it.otherNode.id)
          merged.push(it)
        }
      }
      merged.sort((a, b) => b.edge.confidence - a.edge.confidence)
      if (merged.length > 0) out.push({ title: g.title, items: merged })
    }
    return out
  }, [data, characterId])

  if (isLoading) {
    return (
      <section className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </section>
    )
  }

  if (!data || groups.length === 0) {
    return null
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Relationships</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            From the LLM-extracted Story Graph (confidence ≥{' '}
            {MIN_CONFIDENCE.toFixed(1)}).
          </p>
        </div>
        <Link
          to={`/analytics/story-graph?focus=${encodeURIComponent(characterName)}`}
          className="flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-medium bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 hover:bg-fuchsia-100 transition-colors whitespace-nowrap"
        >
          Open Story Graph →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {g.title}{' '}
              <span className="text-gray-400 font-normal">
                ({g.items.length})
              </span>
            </div>
            <ul className="space-y-1.5 text-sm">
              {g.items.slice(0, MAX_PER_GROUP).map((it) => {
                const otherIsCharacter =
                  it.otherNode.type === 'character' && it.otherNode.source_id
                const nameEl = otherIsCharacter ? (
                  <Link
                    to={`/characters/${it.otherNode.source_id}`}
                    className="text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                  >
                    {it.otherNode.canonical_name}
                  </Link>
                ) : (
                  <span className="text-gray-900">
                    {it.otherNode.canonical_name}
                  </span>
                )
                return (
                  <li key={it.edge.id} className="leading-snug">
                    <span className="text-gray-500 mr-1.5">{it.label}</span>
                    {nameEl}
                  </li>
                )
              })}
              {g.items.length > MAX_PER_GROUP && (
                <li className="text-xs text-gray-400 italic">
                  +{g.items.length - MAX_PER_GROUP} more — see Story Graph
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
