import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Network, DataSet } from 'vis-network/standalone'
import { fetchAllAffiliations } from '../../services/affiliationService'
import { CharacterAffiliation } from '../../types/affiliation'

interface GroupNode {
  id: string
  label: string
  memberCount: number
}

interface SharedEdge {
  from: string
  to: string
  sharedMembers: string[]
  weight: number
}

function buildNetwork(
  affiliations: CharacterAffiliation[],
  minMembers: number,
  minShared: number,
  hideIsolated: boolean
): { nodes: GroupNode[]; edges: SharedEdge[] } {
  // Count members per group
  const groupMembers = new Map<string, Set<string>>()
  for (const a of affiliations) {
    const set = groupMembers.get(a.group_name) || new Set()
    set.add(a.character_id)
    groupMembers.set(a.group_name, set)
  }

  // Filter groups by minimum member count
  const qualifiedGroups = new Map<string, Set<string>>()
  for (const [group, members] of groupMembers) {
    if (members.size >= minMembers) {
      qualifiedGroups.set(group, members)
    }
  }

  // Build nodes
  const nodes: GroupNode[] = Array.from(qualifiedGroups.entries()).map(
    ([group, members]) => ({
      id: group,
      label: group,
      memberCount: members.size,
    })
  )

  // Build edges: groups that share members
  const groupNames = Array.from(qualifiedGroups.keys())
  const edges: SharedEdge[] = []

  for (let i = 0; i < groupNames.length; i++) {
    for (let j = i + 1; j < groupNames.length; j++) {
      const a = qualifiedGroups.get(groupNames[i])!
      const b = qualifiedGroups.get(groupNames[j])!
      const shared = [...a].filter((m) => b.has(m))
      if (shared.length >= minShared) {
        edges.push({
          from: groupNames[i],
          to: groupNames[j],
          sharedMembers: shared,
          weight: shared.length,
        })
      }
    }
  }

  if (hideIsolated) {
    const connectedGroups = new Set<string>()
    for (const e of edges) {
      connectedGroups.add(e.from)
      connectedGroups.add(e.to)
    }
    return { nodes: nodes.filter((n) => connectedGroups.has(n.id)), edges }
  }

  return { nodes, edges }
}

export function AffiliationNetworkGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const [minMembers, setMinMembers] = useState(5)
  const [minShared, setMinShared] = useState(2)
  const [selectedEdge, setSelectedEdge] = useState<SharedEdge | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hideIsolated, setHideIsolated] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: affiliations = [], isLoading } = useQuery({
    queryKey: ['all-affiliations'],
    queryFn: fetchAllAffiliations,
    staleTime: 10 * 60 * 1000,
  })

  const { nodes, edges } = useMemo(
    () => buildNetwork(affiliations, minMembers, minShared, hideIsolated),
    [affiliations, minMembers, minShared, hideIsolated]
  )

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    const maxSize = Math.max(...nodes.map((n) => n.memberCount))
    const maxEdgeWeight =
      edges.length > 0 ? Math.max(...edges.map((e) => e.weight)) : 1

    const visNodes = new DataSet(
      nodes.map((n) => ({
        id: n.id,
        label: `${n.label}\n(${n.memberCount})`,
        size: 10 + (n.memberCount / maxSize) * 40,
        color: {
          background: '#dbeafe',
          border: '#3b82f6',
          highlight: { background: '#93c5fd', border: '#2563eb' },
        },
        font: { size: 10, face: 'system-ui', color: '#374151' },
        title: `${n.label}: ${n.memberCount} members`,
      }))
    )

    const visEdges = new DataSet(
      edges.map((e, i) => ({
        id: i,
        from: e.from,
        to: e.to,
        value: e.weight,
        width: 1 + (e.weight / maxEdgeWeight) * 6,
        color: { color: '#d1d5db', highlight: '#6366f1', opacity: 0.6 },
        title: `${e.sharedMembers.length} shared members`,
      }))
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
        const edge = edges[params.edges[0]]
        if (edge) setSelectedEdge(edge)
      }
    })

    network.on('selectNode', (params) => {
      if (params.nodes.length === 1) {
        setSelectedNode(params.nodes[0])
        setSelectedEdge(null)
      }
    })

    network.on('deselectNode', () => setSelectedNode(null))
    network.on('deselectEdge', () => setSelectedEdge(null))

    networkRef.current = network
    return () => network.destroy()
  }, [nodes, edges])

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return nodes
      .filter((n) => n.label.toLowerCase().includes(q))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 10)
  }, [search, nodes])

  const focusNode = useCallback((nodeId: string) => {
    const net = networkRef.current
    if (!net) return
    net.selectNodes([nodeId])
    net.focus(nodeId, { scale: 1.5, animation: true })
    setSelectedNode(nodeId)
    setSelectedEdge(null)
    setSearch('')
    setSearchOpen(false)
  }, [])

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedNodeInfo = useMemo(() => {
    if (!selectedNode) return null
    const node = nodes.find((n) => n.id === selectedNode)
    if (!node) return null
    const connectedEdges = edges.filter(
      (e) => e.from === selectedNode || e.to === selectedNode
    )
    const members = affiliations
      .filter((a) => a.group_name === selectedNode)
      .sort((a, b) => a.character_id.localeCompare(b.character_id))
    return { node, connectedEdges, members }
  }, [selectedNode, nodes, edges, affiliations])

  return (
    <>
      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-6">
        <div ref={searchRef} className="relative">
          <input
            type="text"
            placeholder="Search group..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => search.trim() && setSearchOpen(true)}
            className="w-48 px-3 py-1 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((n) => (
                <button
                  key={n.id}
                  onClick={() => focusNode(n.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <span className="truncate text-gray-900">{n.label}</span>
                  <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                    {n.memberCount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Min group size:
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={minMembers}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v) && v >= 1) setMinMembers(v)
            }}
            className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Min shared members:
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={minShared}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v) && v >= 1) setMinShared(v)
            }}
            className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideIsolated}
            onChange={(e) => setHideIsolated(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Hide isolated nodes
        </label>
        <button
          onClick={() => networkRef.current?.fit({ animation: true })}
          className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Reset zoom
        </button>
        <div className="text-sm text-gray-500">
          {nodes.length} groups, {edges.length} connections
        </div>
      </div>

      {/* Graph */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div
              ref={containerRef}
              className="w-full bg-white border border-gray-200 rounded-xl"
              style={{ height: 600 }}
            />
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {selectedEdge && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Shared Members
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  <Link
                    to={`/affiliations/${encodeURIComponent(selectedEdge.from)}`}
                    className="text-blue-600 hover:underline"
                  >
                    {selectedEdge.from}
                  </Link>{' '}
                  ↔{' '}
                  <Link
                    to={`/affiliations/${encodeURIComponent(selectedEdge.to)}`}
                    className="text-blue-600 hover:underline"
                  >
                    {selectedEdge.to}
                  </Link>
                </p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {selectedEdge.sharedMembers.map((id) => (
                    <Link
                      key={id}
                      to={`/characters/${id}`}
                      className="block text-xs text-blue-600 hover:text-blue-800 hover:underline py-0.5"
                    >
                      {id.replace(/_/g, ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {selectedNodeInfo && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  <Link
                    to={`/affiliations/${encodeURIComponent(selectedNodeInfo.node.id)}`}
                    className="text-blue-600 hover:underline"
                  >
                    {selectedNodeInfo.node.label}
                  </Link>
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {selectedNodeInfo.node.memberCount} members,{' '}
                  {selectedNodeInfo.connectedEdges.length} connections
                </p>

                {selectedNodeInfo.connectedEdges.length > 0 && (
                  <>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
                      Connections
                    </h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto mb-3">
                      {selectedNodeInfo.connectedEdges
                        .sort((a, b) => b.weight - a.weight)
                        .map((e) => {
                          const other =
                            e.from === selectedNodeInfo.node.id
                              ? e.to
                              : e.from
                          return (
                            <div
                              key={other}
                              className="flex items-center justify-between text-xs"
                            >
                              <Link
                                to={`/affiliations/${encodeURIComponent(other)}`}
                                className="text-blue-600 hover:underline truncate"
                              >
                                {other}
                              </Link>
                              <span className="ml-2 text-gray-400 flex-shrink-0">
                                {e.weight} shared
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </>
                )}

                <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
                  Members ({selectedNodeInfo.members.length})
                </h4>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {selectedNodeInfo.members.map((m) => (
                    <Link
                      key={m.character_id}
                      to={`/characters/${m.character_id}`}
                      className="flex items-center justify-between text-xs py-0.5"
                    >
                      <span className="text-blue-600 hover:text-blue-800 hover:underline truncate">
                        {m.character_id.replace(/_/g, ' ')}
                      </span>
                      {m.status && (
                        <span className="ml-2 text-gray-400 flex-shrink-0">
                          {m.status}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!selectedEdge && !selectedNodeInfo && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
                Click a node or edge to see details.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
