import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Network, DataSet } from 'vis-network/standalone'
import { fetchStoryGraph } from '../../services/storyGraphService'
import { GraphEdge, GraphNode } from '../../types/storyGraph'

// ─── Visual encodings ────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, { background: string; border: string }> = {
  character: { background: '#dbeafe', border: '#3b82f6' },
  crew: { background: '#fee2e2', border: '#ef4444' },
  organization: { background: '#fef3c7', border: '#f59e0b' },
  saga: { background: '#ede9fe', border: '#8b5cf6' },
  arc: { background: '#e5e7eb', border: '#6b7280' },
  devil_fruit: { background: '#d1fae5', border: '#10b981' },
  location: { background: '#ccfbf1', border: '#14b8a6' },
}

const REL_COLORS: Record<string, string> = {
  fought: '#dc2626',
  defeated_by: '#991b1b',
  enemy_of: '#ef4444',
  ally_of: '#10b981',
  member_of_crew: '#3b82f6',
  captain_of: '#1d4ed8',
  affiliated_with: '#60a5fa',
  family_of: '#a855f7',
  mentor_of: '#ca8a04',
  ate_devil_fruit: '#0d9488',
  originates_from: '#6b7280',
  has_bounty_of: '#334155',
}

const DEFAULT_NODE_COLOR = { background: '#f3f4f6', border: '#9ca3af' }
const DEFAULT_REL_COLOR = '#9ca3af'

// ─── BFS subgraph ───────────────────────────────────────────────────────────

/** Bidirectional BFS up to `hops` hops from focusId, capped at maxEdges. */
function bfsSubgraph(
  focusId: number | null,
  edges: GraphEdge[],
  hops: number,
  maxEdges: number
): GraphEdge[] {
  if (focusId == null) return edges.slice(0, maxEdges)

  // Build adjacency
  const adj = new Map<number, GraphEdge[]>()
  for (const e of edges) {
    let bucketS = adj.get(e.subject_id)
    if (!bucketS) {
      bucketS = []
      adj.set(e.subject_id, bucketS)
    }
    bucketS.push(e)
    let bucketO = adj.get(e.object_id)
    if (!bucketO) {
      bucketO = []
      adj.set(e.object_id, bucketO)
    }
    bucketO.push(e)
  }

  const visitedNodes = new Set<number>([focusId])
  const visitedEdgeKeys = new Set<string>()
  const visitedEdges: GraphEdge[] = []
  let frontier = new Set<number>([focusId])

  for (let i = 0; i < hops; i++) {
    if (visitedEdges.length >= maxEdges) break
    const next = new Set<number>()
    for (const n of frontier) {
      const nEdges = adj.get(n) ?? []
      for (const e of nEdges) {
        const key = `${e.subject_id}-${e.relation}-${e.object_id}`
        if (visitedEdgeKeys.has(key)) continue
        visitedEdgeKeys.add(key)
        visitedEdges.push(e)
        visitedNodes.add(e.subject_id)
        visitedNodes.add(e.object_id)
        const other = e.subject_id === n ? e.object_id : e.subject_id
        next.add(other)
        if (visitedEdges.length >= maxEdges) break
      }
      if (visitedEdges.length >= maxEdges) break
    }
    // Drop already-visited from the next frontier
    for (const v of visitedNodes) next.delete(v)
    if (next.size === 0) break
    frontier = next
  }

  return visitedEdges
}

// ─── Component ──────────────────────────────────────────────────────────────

export function StoryGraphView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)

  const [focusName, setFocusName] = useState('Monkey D. Luffy')
  const [hops, setHops] = useState(2)
  const [minConf, setMinConf] = useState(0.7)
  const [maxEdges, setMaxEdges] = useState(400)
  const [excludedRelations, setExcludedRelations] = useState<Set<string>>(
    new Set()
  )
  const [excludedNodeTypes, setExcludedNodeTypes] = useState<Set<string>>(
    new Set()
  )
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['story-graph'],
    queryFn: fetchStoryGraph,
    staleTime: 10 * 60 * 1000,
  })

  const nodesById = useMemo(() => {
    const m = new Map<number, GraphNode>()
    for (const n of data?.nodes ?? []) m.set(n.id, n)
    return m
  }, [data])

  const nameToId = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of data?.nodes ?? []) m.set(n.canonical_name, n.id)
    return m
  }, [data])

  const allRelations = useMemo(() => {
    const s = new Set<string>()
    for (const e of data?.edges ?? []) s.add(e.relation)
    return Array.from(s).sort()
  }, [data])

  const allNodeTypes = useMemo(() => {
    const s = new Set<string>()
    for (const n of data?.nodes ?? []) s.add(n.type)
    return Array.from(s).sort()
  }, [data])

  const focusId = nameToId.get(focusName) ?? null

  // Filter then BFS
  const visibleEdges = useMemo(() => {
    if (!data) return []
    const filtered = data.edges.filter((e) => {
      if (e.confidence < minConf) return false
      if (excludedRelations.has(e.relation)) return false
      const subj = nodesById.get(e.subject_id)
      const obj = nodesById.get(e.object_id)
      if (!subj || !obj) return false
      if (excludedNodeTypes.has(subj.type)) return false
      if (excludedNodeTypes.has(obj.type)) return false
      return true
    })
    return bfsSubgraph(focusId, filtered, hops, maxEdges)
  }, [
    data,
    minConf,
    excludedRelations,
    excludedNodeTypes,
    focusId,
    hops,
    maxEdges,
    nodesById,
  ])

  const visibleNodeIds = useMemo(() => {
    const s = new Set<number>()
    for (const e of visibleEdges) {
      s.add(e.subject_id)
      s.add(e.object_id)
    }
    if (focusId != null) s.add(focusId)
    return s
  }, [visibleEdges, focusId])

  // ─── vis-network render ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !data || visibleNodeIds.size === 0) return

    const visNodes = new DataSet(
      Array.from(visibleNodeIds).map((id) => {
        const n = nodesById.get(id)!
        const colors = NODE_COLORS[n.type] ?? DEFAULT_NODE_COLOR
        const isFocus = id === focusId
        return {
          id,
          label: n.canonical_name,
          title: `${n.canonical_name} (${n.type})`,
          color: {
            background: colors.background,
            border: colors.border,
            highlight: { background: colors.background, border: '#1f2937' },
          },
          size: isFocus ? 28 : 14,
          borderWidth: isFocus ? 4 : 1,
          font: {
            size: isFocus ? 16 : 11,
            face: 'system-ui',
            color: '#1f2937',
          },
        }
      })
    )

    const visEdges = new DataSet(
      visibleEdges.map((e) => {
        const color = REL_COLORS[e.relation] ?? DEFAULT_REL_COLOR
        const evShort = (e.evidence_text ?? '')
          .replace(/\s+/g, ' ')
          .slice(0, 200)
        return {
          id: e.id,
          from: e.subject_id,
          to: e.object_id,
          label: e.relation,
          title: `${e.relation} · conf ${e.confidence.toFixed(2)}${
            evShort ? `\n\n${evShort}` : ''
          }`,
          color: { color, highlight: '#111827', opacity: 0.7 },
          width: 1 + e.confidence * 2,
          arrows: 'to',
          font: { size: 9, color: '#6b7280', strokeWidth: 0, align: 'middle' },
        }
      })
    )

    const network = new Network(
      containerRef.current,
      { nodes: visNodes, edges: visEdges },
      {
        physics: {
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -80,
            centralGravity: 0.01,
            springLength: 150,
            springConstant: 0.08,
          },
          stabilization: { iterations: 200 },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true,
        },
        edges: {
          smooth: { enabled: true, type: 'continuous', roundness: 0.5 },
        },
      }
    )

    network.on('selectEdge', (params) => {
      if (params.edges.length === 1) {
        const eid = params.edges[0]
        const edge = visibleEdges.find((x) => x.id === eid)
        if (edge) setSelectedEdge(edge)
      }
    })
    network.on('selectNode', (params) => {
      if (params.nodes.length === 1) {
        setSelectedNodeId(params.nodes[0] as number)
        setSelectedEdge(null)
      }
    })
    network.on('deselectNode', () => setSelectedNodeId(null))
    network.on('deselectEdge', () => setSelectedEdge(null))
    network.on('doubleClick', (params) => {
      if (params.nodes.length === 1) {
        const id = params.nodes[0] as number
        const n = nodesById.get(id)
        if (n) setFocusName(n.canonical_name)
      }
    })

    networkRef.current = network
    return () => {
      network.destroy()
      networkRef.current = null
    }
  }, [data, visibleEdges, visibleNodeIds, nodesById, focusId])

  // ─── Search dropdown ───────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!search.trim() || !data) return []
    const q = search.toLowerCase()
    return data.nodes
      .filter(
        (n) =>
          n.canonical_name.toLowerCase().includes(q) ||
          (n.aliases ?? []).some((a) => a.toLowerCase().includes(q))
      )
      .slice(0, 12)
  }, [search, data])

  const pickFocus = useCallback((name: string) => {
    setFocusName(name)
    setSearch('')
    setSearchOpen(false)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── Selected detail ──────────────────────────────────────────────────
  const selectedNodeInfo = useMemo(() => {
    if (selectedNodeId == null) return null
    const node = nodesById.get(selectedNodeId)
    if (!node) return null
    const connectedEdges = visibleEdges.filter(
      (e) => e.subject_id === selectedNodeId || e.object_id === selectedNodeId
    )
    return { node, connectedEdges }
  }, [selectedNodeId, visibleEdges, nodesById])

  // ─── Render ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
        Failed to load story graph: {(error as Error).message}
      </div>
    )
  }

  return (
    <>
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-4">
        {/* Focus search */}
        <div ref={searchRef} className="relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Focus on
          </label>
          <input
            type="text"
            placeholder={focusName}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => search.trim() && setSearchOpen(true)}
            className="w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            aria-label="Search a character or entity to focus the graph on"
          />
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((n) => (
                <button
                  key={n.id}
                  onClick={() => pickFocus(n.canonical_name)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <span className="truncate text-gray-900">
                    {n.canonical_name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                    {n.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hops */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Hops: {hops}
          </label>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={hops}
            onChange={(e) => setHops(parseInt(e.target.value, 10))}
            className="w-32"
            aria-label="Hops from focus node"
          />
        </div>

        {/* Min confidence */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Min confidence: {minConf.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.6}
            max={1.0}
            step={0.05}
            value={minConf}
            onChange={(e) => setMinConf(parseFloat(e.target.value))}
            className="w-40"
            aria-label="Minimum confidence threshold"
          />
        </div>

        {/* Max edges */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Max edges: {maxEdges}
          </label>
          <input
            type="range"
            min={50}
            max={1500}
            step={50}
            value={maxEdges}
            onChange={(e) => setMaxEdges(parseInt(e.target.value, 10))}
            className="w-40"
            aria-label="Maximum edges to render"
          />
        </div>

        {/* Reset zoom */}
        <button
          onClick={() => networkRef.current?.fit({ animation: true })}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Reset zoom
        </button>

        {/* Counts */}
        <div className="ml-auto text-sm text-gray-500">
          {visibleNodeIds.size} nodes · {visibleEdges.length} edges
          {data ? ` (of ${data.edges.length.toLocaleString()} total)` : ''}
        </div>
      </div>

      {/* Relation + node-type toggles */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">
            Relation types
          </div>
          <div className="flex flex-wrap gap-2">
            {allRelations.map((rel) => {
              const on = !excludedRelations.has(rel)
              const color = REL_COLORS[rel] ?? DEFAULT_REL_COLOR
              return (
                <button
                  key={rel}
                  onClick={() => {
                    setExcludedRelations((prev) => {
                      const next = new Set(prev)
                      if (next.has(rel)) next.delete(rel)
                      else next.add(rel)
                      return next
                    })
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    on
                      ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-100 text-gray-400'
                  }`}
                  style={on ? { borderColor: color, color } : undefined}
                  aria-pressed={on}
                >
                  {rel}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">
            Node types
          </div>
          <div className="flex flex-wrap gap-2">
            {allNodeTypes.map((t) => {
              const on = !excludedNodeTypes.has(t)
              const colors = NODE_COLORS[t] ?? DEFAULT_NODE_COLOR
              return (
                <button
                  key={t}
                  onClick={() => {
                    setExcludedNodeTypes((prev) => {
                      const next = new Set(prev)
                      if (next.has(t)) next.delete(t)
                      else next.add(t)
                      return next
                    })
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    on ? '' : 'opacity-40'
                  }`}
                  style={{
                    borderColor: colors.border,
                    backgroundColor: on ? colors.background : '#f3f4f6',
                    color: colors.border,
                  }}
                  aria-pressed={on}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Graph + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-[640px]">
              <div className="animate-spin rounded-full border-b-2 border-blue-600 h-10 w-10"></div>
            </div>
          ) : visibleEdges.length === 0 ? (
            <div className="flex justify-center items-center h-[640px] text-gray-500 text-sm px-6 text-center">
              No edges match the current filters. Lower the min confidence,
              re-enable some relations, or pick a more central node.
            </div>
          ) : (
            <div ref={containerRef} className="w-full h-[640px]" />
          )}
        </div>

        {/* Side panel: selected node / edge */}
        <aside className="space-y-4">
          {selectedEdge ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Selected edge
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {nodesById.get(selectedEdge.subject_id)?.canonical_name}
                <span
                  className="mx-2 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      REL_COLORS[selectedEdge.relation] ?? DEFAULT_REL_COLOR,
                    color: '#fff',
                  }}
                >
                  {selectedEdge.relation}
                </span>
                {nodesById.get(selectedEdge.object_id)?.canonical_name}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                confidence {selectedEdge.confidence.toFixed(2)}
                {selectedEdge.evidence_chapter
                  ? ` · chapter ${selectedEdge.evidence_chapter}`
                  : ''}
              </div>
              {selectedEdge.evidence_text ? (
                <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                  &ldquo;{selectedEdge.evidence_text}&rdquo;
                </p>
              ) : null}
            </div>
          ) : selectedNodeInfo ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Selected node ({selectedNodeInfo.node.type})
              </div>
              <div className="text-base font-semibold text-gray-900">
                {selectedNodeInfo.node.canonical_name}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {selectedNodeInfo.connectedEdges.length} connected edges visible
                · double-click in the graph to focus a node
              </div>
              <div className="mt-3 max-h-72 overflow-y-auto pr-1 space-y-1">
                {selectedNodeInfo.connectedEdges.slice(0, 50).map((e) => {
                  const isOut = e.subject_id === selectedNodeInfo.node.id
                  const otherId = isOut ? e.object_id : e.subject_id
                  const other = nodesById.get(otherId)
                  return (
                    <div
                      key={e.id}
                      className="text-xs text-gray-700 leading-snug"
                    >
                      <span className="text-gray-400">{isOut ? '→' : '←'}</span>{' '}
                      <span
                        className="font-medium"
                        style={{
                          color: REL_COLORS[e.relation] ?? DEFAULT_REL_COLOR,
                        }}
                      >
                        {e.relation}
                      </span>{' '}
                      {other?.canonical_name ?? `#${otherId}`}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
              Click a node or edge to inspect details. Double-click a node to
              re-focus the graph there.
            </div>
          )}

          {/* Legend */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">
              How to read the graph
            </div>
            <ul className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
              <li>· Drag to pan, scroll to zoom, drag a node to move it</li>
              <li>· Hover an edge for evidence quote + confidence</li>
              <li>· Double-click a node to re-focus on it</li>
              <li>
                · Edges are drawn from the LLM extraction pipeline; some are
                bidirectional by design (e.g. a fight produces both{' '}
                <em>fought</em> edges)
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}
