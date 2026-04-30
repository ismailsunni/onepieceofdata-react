import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchStoryGraph } from '../../services/storyGraphService'
import { GraphEdge, GraphNode } from '../../types/storyGraph'
import { formatRelationDirected } from '../../utils/formatRelation'

const MIN_CONFIDENCE = 0.7
const MAX_PER_GROUP = 12

// Only fought / allies / enemies are reliable enough from the extracted
// story graph to surface on the character page; other relations
// (crew, family, mentor, defeats, origin, ...) are too noisy.
interface GroupConfig {
  title: string
  buckets: string[]
  /** Tailwind classes for the icon container, count badge, and pill tags. */
  iconBg: string
  iconColor: string
  countBg: string
  countText: string
  pill: string
  /** Icon path (Heroicons / inline SVG). */
  iconPath: string
}

const GROUPS: GroupConfig[] = [
  {
    title: 'Fought',
    buckets: ['fought'],
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    countBg: 'bg-amber-100',
    countText: 'text-amber-700',
    pill: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100',
    iconPath:
      'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
  },
  {
    title: 'Allies',
    buckets: ['ally_of'],
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    countBg: 'bg-emerald-100',
    countText: 'text-emerald-700',
    pill: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100',
    iconPath:
      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    title: 'Enemies',
    buckets: ['enemy_of'],
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    countBg: 'bg-rose-100',
    countText: 'text-rose-700',
    pill: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100',
    iconPath:
      'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  },
]

interface RelationItem {
  edge: GraphEdge
  /** The "other" node (not this character). */
  otherNode: GraphNode
  /** Whether this character is the subject of the edge (edge points outward). */
  isOutgoing: boolean
  /** Pre-computed bucket key used to assign the item to a section. */
  bucket: string
}

interface RelationGroup {
  config: GroupConfig
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
      if (merged.length > 0) out.push({ config: g, items: merged })
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groups.map((g) => {
          const visible = g.items.slice(0, MAX_PER_GROUP)
          const overflow = g.items.length - visible.length
          const pillBase =
            'inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors'
          return (
            <div
              key={g.config.title}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 ${g.config.iconBg} rounded-lg`}>
                    <svg
                      className={`w-4 h-4 ${g.config.iconColor}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={g.config.iconPath}
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {g.config.title}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full ${g.config.countBg} ${g.config.countText} text-xs font-semibold`}
                >
                  {g.items.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {visible.map((it) => {
                  const otherIsCharacter =
                    it.otherNode.type === 'character' && it.otherNode.source_id
                  if (otherIsCharacter) {
                    return (
                      <Link
                        key={it.edge.id}
                        to={`/characters/${it.otherNode.source_id}`}
                        className={`${pillBase} ${g.config.pill}`}
                      >
                        {it.otherNode.canonical_name}
                      </Link>
                    )
                  }
                  return (
                    <span
                      key={it.edge.id}
                      className={`${pillBase} ${g.config.pill}`}
                    >
                      {it.otherNode.canonical_name}
                    </span>
                  )
                })}
                {overflow > 0 && (
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium text-gray-500 italic">
                    +{overflow} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
