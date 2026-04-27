import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchStoryGraph } from '../../services/storyGraphService'
import { GraphEdge, GraphNode } from '../../types/storyGraph'
import { formatRelation } from '../../utils/formatRelation'

const MIN_CONFIDENCE = 0.7
const MAX_PER_GROUP = 12

/** Order in which relation groups are presented on the character page. */
const GROUPS: { title: string; relations: string[] }[] = [
  {
    title: 'Crew & affiliations',
    relations: ['member_of_crew', 'captain_of', 'affiliated_with'],
  },
  { title: 'Allies', relations: ['ally_of'] },
  { title: 'Enemies', relations: ['enemy_of'] },
  { title: 'Fights', relations: ['fought', 'defeated_by'] },
  { title: 'Family', relations: ['family_of'] },
  { title: 'Mentors', relations: ['mentor_of'] },
  {
    title: 'Origin & devil fruit',
    relations: ['originates_from', 'ate_devil_fruit'],
  },
]

interface RelationItem {
  edge: GraphEdge
  /** The "other" node (not this character). */
  otherNode: GraphNode
  /** Whether this character is the subject of the edge (edge points outward). */
  isOutgoing: boolean
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

    // Bucket edges by relation, keeping only ones above the threshold
    const byRelation = new Map<string, RelationItem[]>()
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
      const list = byRelation.get(e.relation) ?? []
      list.push({ edge: e, otherNode, isOutgoing })
      byRelation.set(e.relation, list)
    }

    // Assemble groups in defined order, sorted by confidence DESC, deduped by other node
    const out: RelationGroup[] = []
    for (const g of GROUPS) {
      const merged: RelationItem[] = []
      const seenOtherIds = new Set<number>()
      for (const rel of g.relations) {
        const items = byRelation.get(rel) ?? []
        for (const it of items) {
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
                    <span className="text-gray-400 mr-1.5">
                      {it.isOutgoing ? '→' : '←'}
                    </span>
                    <span className="text-gray-500 mr-1.5">
                      {formatRelation(it.edge.relation)}
                    </span>
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
