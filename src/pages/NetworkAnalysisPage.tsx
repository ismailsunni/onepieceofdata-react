import { useEffect, useRef, useState, useCallback } from 'react'
import { Network, DataSet } from 'vis-network/standalone'
import { SectionHeader } from '../components/analytics'
import { RangeSlider } from '../components/common/RangeSlider'

// ─── Dataset definitions ──────────────────────────────────────────────────────
const DATASETS = [
  {
    id: 'general',
    label: 'General (all chapters)',
    description: 'All chapter co-appearances, characters with >10 appearances',
    format: 'csv' as const,
    nodes: '/character_network_nodes_gt10.csv',
    edges: '/character_coappearance_edges_gt10.csv',
    defaultMinApp: 11,
    defaultMinWt: 10,
  },
  {
    id: 'arc',
    label: 'By Arc',
    description: 'Characters co-appearing within the same arc',
    format: 'json' as const,
    file: '/network_arc.json',
    defaultMinApp: 1,
    defaultMinWt: 5,
  },
  {
    id: 'saga',
    label: 'By Saga',
    description: 'Characters co-appearing within the same saga',
    format: 'json' as const,
    file: '/network_saga.json',
    defaultMinApp: 1,
    defaultMinWt: 5,
  },
  {
    id: 'chapter',
    label: 'By Chapter',
    description: 'Characters co-appearing in the same chapter',
    format: 'json' as const,
    file: '/network_chapter.json',
    defaultMinApp: 1,
    defaultMinWt: 5,
  },
  {
    id: 'consec-2',
    label: 'Consecutive (2 chapters)',
    description: 'Characters co-appearing across 2 consecutive chapters',
    format: 'json' as const,
    file: '/network_consec-2.json',
    defaultMinApp: 1,
    defaultMinWt: 3,
  },
  {
    id: 'consec-3',
    label: 'Consecutive (3 chapters)',
    description: 'Characters co-appearing across 3 consecutive chapters',
    format: 'json' as const,
    file: '/network_consec-3.json',
    defaultMinApp: 1,
    defaultMinWt: 3,
  },
  {
    id: 'consec-5',
    label: 'Consecutive (5 chapters)',
    description: 'Characters co-appearing across 5 consecutive chapters',
    format: 'json' as const,
    file: '/network_consec-5.json',
    defaultMinApp: 1,
    defaultMinWt: 3,
  },
  {
    id: 'consec-7',
    label: 'Consecutive (7 chapters)',
    description: 'Characters co-appearing across 7 consecutive chapters',
    format: 'json' as const,
    file: '/network_consec-7.json',
    defaultMinApp: 1,
    defaultMinWt: 3,
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface RawNode {
  id: string
  name: string
  appearance_count: number
  weighted_degree: number
  degree: number
}

interface RawEdge {
  source: string
  source_name: string
  target: string
  target_name: string
  weight: number
}

interface Stats {
  nodesShown: number
  edgesShown: number
  totalEligible: number
}

// ─── Community detection (Louvain phase-1, modularity optimisation) ──────────
const COMMUNITY_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#a855f7', // purple
]

function detectCommunities(
  nodes: RawNode[],
  edges: RawEdge[]
): Map<string, number> {
  // Build weighted adjacency
  const adj = new Map<string, Map<string, number>>()
  nodes.forEach((n) => adj.set(n.id, new Map()))
  let totalWeight = 0
  edges.forEach((e) => {
    adj.get(e.source)?.set(e.target, e.weight)
    adj.get(e.target)?.set(e.source, e.weight)
    totalWeight += e.weight
  })
  const m = totalWeight || 1

  // Weighted degree per node
  const k = new Map<string, number>()
  nodes.forEach((n) => {
    let deg = 0
    for (const w of (adj.get(n.id) ?? new Map()).values()) deg += w
    k.set(n.id, deg)
  })

  // Each node starts in its own community (keyed by node id)
  const comm = new Map<string, string>()
  nodes.forEach((n) => comm.set(n.id, n.id))

  // Sum of weights incident to each community (Σ_tot)
  const commTot = new Map<string, number>()
  nodes.forEach((n) => commTot.set(n.id, k.get(n.id) ?? 0))

  // Louvain phase 1: move each node to the neighbour community with max ΔQ
  for (let iter = 0; iter < 150; iter++) {
    let improved = false
    const order = [...nodes].sort(() => Math.random() - 0.5)

    for (const node of order) {
      const curComm = comm.get(node.id)!
      const ki = k.get(node.id) ?? 0
      const neighbors = adj.get(node.id) ?? new Map<string, number>()

      // Aggregate edge weight from this node into each neighbouring community
      const toComm = new Map<string, number>()
      for (const [nbId, w] of neighbors) {
        const c = comm.get(nbId)!
        toComm.set(c, (toComm.get(c) ?? 0) + w)
      }

      // ΔQ = k_i_in/m − (Σ_tot × k_i) / (2m²)
      let bestDelta = 0
      let bestComm = curComm

      for (const [cand, kiIn] of toComm) {
        if (cand === curComm) continue
        const sigmaTot = commTot.get(cand) ?? 0
        const delta = kiIn / m - (sigmaTot * ki) / (2 * m * m)
        if (delta > bestDelta) {
          bestDelta = delta
          bestComm = cand
        }
      }

      if (bestComm !== curComm) {
        commTot.set(curComm, (commTot.get(curComm) ?? 0) - ki)
        commTot.set(bestComm, (commTot.get(bestComm) ?? 0) + ki)
        comm.set(node.id, bestComm)
        improved = true
      }
    }
    if (!improved) break
  }

  // Re-index 0,1,2,… sorted by community size descending
  const sizeCount = new Map<string, number>()
  comm.forEach((c) => sizeCount.set(c, (sizeCount.get(c) ?? 0) + 1))
  const unique = [...new Set(comm.values())]
  unique.sort((a, b) => (sizeCount.get(b) ?? 0) - (sizeCount.get(a) ?? 0))
  const remap = new Map(unique.map((c, i) => [c, i]))

  const result = new Map<string, number>()
  comm.forEach((c, id) => result.set(id, remap.get(c)!))
  return result
}

// ─── Tooltip builder (vis-network needs DOM nodes for HTML) ───────────────────
function makeTooltip(html: string): HTMLDivElement {
  const div = document.createElement('div')
  div.style.cssText =
    'font-family:Inter,sans-serif;font-size:12px;padding:6px 10px;line-height:1.6;' +
    'background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12);max-width:220px'
  div.innerHTML = html
  return div
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const vals = line.split(',')
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => (obj[h] = (vals[i] ?? '').trim()))
    return obj
  })
}

// ─── Loader: normalise CSV and JSON into RawNode[] / RawEdge[] ────────────────
async function loadDataset(
  datasetId: string
): Promise<{ nodes: RawNode[]; edges: RawEdge[] }> {
  const ds = DATASETS.find((d) => d.id === datasetId)!

  if (ds.format === 'csv') {
    const [nodesText, edgesText] = await Promise.all([
      fetch(ds.nodes).then((r) => r.text()),
      fetch(ds.edges).then((r) => r.text()),
    ])
    const nodes: RawNode[] = parseCsv(nodesText)
      .map((r) => ({
        id: r.id ?? '',
        name: r.name ?? r.id ?? '',
        appearance_count: Number(r.appearance_count) || 0,
        weighted_degree: Number(r.weighted_degree) || 0,
        degree: Number(r.degree) || 0,
      }))
      .filter((n) => n.id)

    const edges: RawEdge[] = parseCsv(edgesText)
      .map((r) => ({
        source: r.source ?? '',
        source_name: r.source_name ?? r.source ?? '',
        target: r.target ?? '',
        target_name: r.target_name ?? r.target ?? '',
        weight: Number(r.weight) || 0,
      }))
      .filter((e) => e.source && e.target)

    return { nodes, edges }
  }

  // JSON format: {nodes: [{id, label, appearance_count}], edges: [{source, target, weight}]}
  const data = await fetch(ds.file).then((r) => r.json())
  const labelMap: Record<string, string> = {}
  const degreeMap: Record<string, number> = {}
  const weightedMap: Record<string, number> = {}

  // Build degree / weighted_degree from edges
  for (const e of data.edges) {
    degreeMap[e.source] = (degreeMap[e.source] ?? 0) + 1
    degreeMap[e.target] = (degreeMap[e.target] ?? 0) + 1
    weightedMap[e.source] = (weightedMap[e.source] ?? 0) + e.weight
    weightedMap[e.target] = (weightedMap[e.target] ?? 0) + e.weight
  }

  const nodes: RawNode[] = (
    data.nodes as { id: string; label: string; appearance_count: number }[]
  ).map((n) => {
    labelMap[n.id] = n.label
    return {
      id: n.id,
      name: n.label,
      appearance_count: n.appearance_count,
      weighted_degree: weightedMap[n.id] ?? 0,
      degree: degreeMap[n.id] ?? 0,
    }
  })

  const edges: RawEdge[] = (
    data.edges as { source: string; target: string; weight: number }[]
  )
    .map((e) => ({
      source: e.source,
      source_name: labelMap[e.source] ?? e.source,
      target: e.target,
      target_name: labelMap[e.target] ?? e.target,
      weight: e.weight,
    }))
    .filter((e) => e.source && e.target)

  return { nodes, edges }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NetworkAnalysisPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodesDataSetRef = useRef<any>(null)
  const baseNodeColorsRef = useRef<Map<string, object>>(new Map())
  const restoreColorsRef = useRef<() => void>(() => {})
  const allNodesRef = useRef<RawNode[]>([])
  const allEdgesRef = useRef<RawEdge[]>([])
  const activeEdgesRef = useRef<RawEdge[]>([])
  const nameToIdRef = useRef<Record<string, string>>({})

  const [datasetId, setDatasetId] = useState('general')
  const [minApp, setMinApp] = useState(11)
  const [maxApp, setMaxApp] = useState(200)
  const [minAppMax, setMinAppMax] = useState(1001)
  const [minWt, setMinWt] = useState(10)
  const [maxWt, setMaxWt] = useState(762)
  const [minWtMax, setMinWtMax] = useState(762)
  const [maxEdges, setMaxEdges] = useState(500)
  const [search, setSearch] = useState('')
  const [selectedNode, setSelectedNode] = useState<RawNode | null>(null)
  const [showCommunities, setShowCommunities] = useState(true)
  const [communityCount, setCommunityCount] = useState(0)
  const [communityGroups, setCommunityGroups] = useState<
    { communityIndex: number; nodes: RawNode[] }[]
  >([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [status, setStatus] = useState('Loading…')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Build graph from loaded data ──────────────────────────────────────────
  const buildGraph = useCallback(
    (
      overrideMinApp?: number,
      overrideMaxApp?: number,
      overrideMinWt?: number,
      overrideMaxWt?: number,
      overrideMaxEdges?: number,
      overrideShowCommunities?: boolean
    ) => {
      if (!containerRef.current) return
      const mA = overrideMinApp ?? minApp
      const xA = overrideMaxApp ?? maxApp
      const mW = overrideMinWt ?? minWt
      const xW = overrideMaxWt ?? maxWt
      const mE = overrideMaxEdges ?? maxEdges
      const useCommunities = overrideShowCommunities ?? showCommunities

      const eligible = allNodesRef.current.filter(
        (n) => n.appearance_count >= mA && n.appearance_count <= xA
      )
      const allowed = new Set(eligible.map((n) => n.id))

      const filteredEdges = allEdgesRef.current
        .filter(
          (e) =>
            e.weight >= mW &&
            e.weight <= xW &&
            allowed.has(e.source) &&
            allowed.has(e.target)
        )
        .sort((a, b) => b.weight - a.weight)
        .slice(0, mE)

      activeEdgesRef.current = filteredEdges

      const seen = new Set<string>()
      filteredEdges.forEach((e) => {
        seen.add(e.source)
        seen.add(e.target)
      })

      const visibleNodes = eligible.filter((n) => seen.has(n.id))

      // Community detection
      let communityMap: Map<string, number> | null = null
      if (useCommunities && visibleNodes.length > 0) {
        const visibleEdges = filteredEdges.filter(
          (e) => seen.has(e.source) && seen.has(e.target)
        )
        communityMap = detectCommunities(visibleNodes, visibleEdges)
        const numCommunities = new Set(communityMap.values()).size
        setCommunityCount(numCommunities)
        // Build groups for the legend table
        const groups = new Map<number, RawNode[]>()
        for (let i = 0; i < numCommunities; i++) groups.set(i, [])
        visibleNodes.forEach((n) => {
          const c = communityMap!.get(n.id) ?? 0
          groups.get(c)?.push(n)
        })
        // Sort each group by appearance_count desc
        const sortedGroups = [...groups.entries()]
          .map(([ci, nodes]) => ({
            communityIndex: ci,
            nodes: nodes.sort(
              (a, b) => b.appearance_count - a.appearance_count
            ),
          }))
          .sort((a, b) => b.nodes.length - a.nodes.length)
        setCommunityGroups(sortedGroups)
      } else {
        setCommunityCount(0)
        setCommunityGroups([])
      }

      const visNodes = visibleNodes.map((n) => {
        const community = communityMap?.get(n.id) ?? -1
        const bg =
          community >= 0
            ? COMMUNITY_COLORS[community % COMMUNITY_COLORS.length]
            : '#3b82f6'
        const border = community >= 0 ? bg : '#1d4ed8'
        return {
          id: n.id,
          label: n.name,
          size: Math.max(
            8,
            Math.min(28, 8 + Math.log10(Math.max(1, n.appearance_count)) * 7)
          ),
          color: {
            background: bg,
            border,
            highlight: { background: '#f59e0b', border: '#d97706' },
            hover: { background: '#60a5fa', border },
          },
          font: { color: '#1f2937', size: 11 },
        }
      })

      // Store base colors so we can restore them after deselect
      baseNodeColorsRef.current = new Map(visNodes.map((n) => [n.id, n.color]))

      const visEdges = filteredEdges.map((e) => ({
        from: e.source,
        to: e.target,
        width: Math.max(
          1,
          Math.min(5, Math.log10(Math.max(1, e.weight)) * 1.8)
        ),
        title: makeTooltip(
          `<strong>${e.source_name}</strong> + <strong>${e.target_name}</strong><br/>${e.weight} co-appearances`
        ),
        color: {
          color: '#93c5fd',
          opacity: 0.7,
          highlight: '#f59e0b',
          hover: '#60a5fa',
        },
      }))

      setStats({
        nodesShown: visNodes.length,
        edgesShown: visEdges.length,
        totalEligible: eligible.length,
      })

      if (visNodes.length === 0) {
        setStatus('No nodes match — try lowering the filters')
        if (networkRef.current) {
          networkRef.current.destroy()
          networkRef.current = null
        }
        return
      }

      setStatus('Building graph…')
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }

      const net = new Network(
        containerRef.current,
        (() => {
          nodesDataSetRef.current = new DataSet(visNodes as never[])
          return {
            nodes: nodesDataSetRef.current,
            edges: new DataSet(visEdges as never[]),
          }
        })(),
        {
          nodes: { shape: 'dot' },
          edges: { smooth: false },
          layout: { randomSeed: 7, improvedLayout: visNodes.length < 80 },
          interaction: {
            hover: true,
            tooltipDelay: 100,
            navigationButtons: true,
            keyboard: true,
          },
          physics: {
            barnesHut: {
              gravitationalConstant: -2000,
              springLength: 120,
              springConstant: 0.04,
              damping: 0.2,
            },
            stabilization: { enabled: true, iterations: 300, fit: true },
          },
        }
      )

      net.once('stabilizationIterationsDone', () => {
        net.setOptions({ physics: false })
        requestAnimationFrame(() => {
          net.redraw()
          net.fit({ animation: true })
        })
        setStatus(
          `${visNodes.length} nodes · ${visEdges.length} edges · stabilized`
        )
      })

      // Use the outer restoreColors via ref to avoid stale closure
      const restoreColors = () => restoreColorsRef.current()

      net.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0] as string
          // Re-clicking the same node → deselect
          setSelectedNode((prev) => {
            if (prev?.id === nodeId) {
              restoreColors()
              net.unselectAll()
              return null
            }
            return allNodesRef.current.find((n) => n.id === nodeId) ?? null
          })
          // If it's a new node, highlight selection
          setSelectedNode((prev) => {
            if (!prev || prev.id !== nodeId) return prev // handled above
            // Apply highlight colours
            if (nodesDataSetRef.current) {
              const neighborIds = new Set(
                activeEdgesRef.current
                  .filter((e) => e.source === nodeId || e.target === nodeId)
                  .map((e) => (e.source === nodeId ? e.target : e.source))
              )
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const updates = (nodesDataSetRef.current.get() as any[]).map(
                (n: any) => {
                  // eslint-disable-line @typescript-eslint/no-explicit-any
                  if (n.id === nodeId) {
                    return {
                      id: n.id,
                      color: {
                        background: '#f59e0b',
                        border: '#d97706',
                        highlight: { background: '#fbbf24', border: '#d97706' },
                        hover: { background: '#fbbf24', border: '#d97706' },
                      },
                    }
                  } else if (neighborIds.has(n.id)) {
                    return {
                      id: n.id,
                      color: {
                        background: '#60a5fa',
                        border: '#3b82f6',
                        highlight: { background: '#93c5fd', border: '#3b82f6' },
                        hover: { background: '#93c5fd', border: '#3b82f6' },
                      },
                    }
                  } else {
                    return {
                      id: n.id,
                      color: {
                        background: '#e5e7eb',
                        border: '#d1d5db',
                        highlight: { background: '#e5e7eb', border: '#d1d5db' },
                        hover: { background: '#e5e7eb', border: '#d1d5db' },
                      },
                    }
                  }
                }
              )
              nodesDataSetRef.current.update(updates)
            }
            return prev
          })
        } else {
          // Clicked canvas — deselect without resetting community colors
          setSelectedNode(null)
          restoreColors()
          net.unselectAll()
        }
      })

      networkRef.current = net
    },
    [minApp, maxApp, minWt, maxWt, maxEdges, showCommunities]
  )

  // ── Load dataset whenever selection changes ───────────────────────────────
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setSelectedNode(null)
    setStats(null)
    setStatus('Loading…')

    const ds = DATASETS.find((d) => d.id === datasetId)!

    loadDataset(datasetId)
      .then(({ nodes, edges }) => {
        allNodesRef.current = nodes
        allEdgesRef.current = edges
        nameToIdRef.current = {}
        nodes.forEach((n) => (nameToIdRef.current[n.name] = n.id))

        const maxApp = Math.max(...nodes.map((n) => n.appearance_count), 1)
        const maxWt = Math.max(...edges.map((e) => e.weight), 1)
        setMinAppMax(maxApp)
        setMinWtMax(maxWt)

        // Reset filters to dataset defaults
        const newMinApp = ds.defaultMinApp
        const newMinWt = ds.defaultMinWt
        const defaultMaxApp = 200
        setMinApp(newMinApp)
        setMaxApp(defaultMaxApp)
        setMinWt(newMinWt)
        setMaxWt(maxWt)
        setMaxEdges(500)
        setIsLoading(false)
        buildGraph(newMinApp, defaultMaxApp, newMinWt, maxWt, 500)
      })
      .catch((e) => {
        setError(String(e))
        setIsLoading(false)
      })

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId])

  // ── Focus character ───────────────────────────────────────────────────────
  const focusCharacter = useCallback(() => {
    if (!networkRef.current) return
    const id = nameToIdRef.current[search.trim()]
    if (!id) {
      setStatus(`Not found: "${search}"`)
      return
    }
    networkRef.current.selectNodes([id])
    networkRef.current.focus(id, {
      scale: 1.5,
      animation: { duration: 400, easingFunction: 'easeInOutQuad' },
    })
    setStatus(`Focused: ${search}`)
  }, [search])

  const fitView = () => networkRef.current?.fit({ animation: true })

  const applyHighlight = useCallback((nodeId: string) => {
    if (!nodesDataSetRef.current) return
    const neighborIds = new Set(
      activeEdgesRef.current
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => (e.source === nodeId ? e.target : e.source))
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates = (nodesDataSetRef.current.get() as any[]).map((n: any) => {
      if (n.id === nodeId) {
        return {
          id: n.id,
          color: {
            background: '#f59e0b',
            border: '#d97706',
            highlight: { background: '#fbbf24', border: '#d97706' },
            hover: { background: '#fbbf24', border: '#d97706' },
          },
        }
      } else if (neighborIds.has(n.id)) {
        return {
          id: n.id,
          color: {
            background: '#60a5fa',
            border: '#3b82f6',
            highlight: { background: '#93c5fd', border: '#3b82f6' },
            hover: { background: '#93c5fd', border: '#3b82f6' },
          },
        }
      } else {
        return {
          id: n.id,
          color: {
            background: '#e5e7eb',
            border: '#d1d5db',
            highlight: { background: '#e5e7eb', border: '#d1d5db' },
            hover: { background: '#e5e7eb', border: '#d1d5db' },
          },
        }
      }
    })
    nodesDataSetRef.current.update(updates)
  }, [])

  const restoreColors = useCallback(() => {
    if (!nodesDataSetRef.current) return

    const updates = (nodesDataSetRef.current.get() as any[]).map((n: any) => ({
      // eslint-disable-line @typescript-eslint/no-explicit-any
      id: n.id,
      color: baseNodeColorsRef.current.get(n.id) ?? {
        background: '#3b82f6',
        border: '#1d4ed8',
        highlight: { background: '#f59e0b', border: '#d97706' },
        hover: { background: '#60a5fa', border: '#1d4ed8' },
      },
    }))
    nodesDataSetRef.current.update(updates)
  }, [])

  restoreColorsRef.current = restoreColors

  const deselectNode = useCallback(() => {
    setSelectedNode(null)
    restoreColors()
    networkRef.current?.unselectAll()
  }, [restoreColors])

  const focusNodeById = useCallback(
    (nodeId: string) => {
      const node = allNodesRef.current.find((n) => n.id === nodeId)
      if (!node || !networkRef.current) return
      // Toggle: clicking the already-selected node deselects it
      setSelectedNode((prev) => {
        if (prev?.id === nodeId) {
          deselectNode()
          return null
        }
        networkRef.current!.selectNodes([nodeId])
        applyHighlight(nodeId)
        return node
      })
    },
    [applyHighlight, deselectNode]
  )

  const activeDs = DATASETS.find((d) => d.id === datasetId)!

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader
          title="Character Network Analysis"
          description="Explore how One Piece characters are connected through co-appearances. Node size reflects appearance count; edge width reflects co-appearance frequency."
        />

        {/* ── Dataset selector ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Network Dataset
          </label>
          <select
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            className="w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {DATASETS.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-400">{activeDs.description}</p>
        </div>

        {/* ── Filter controls ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            {/* Appearance range slider */}
            <RangeSlider
              label="Appearances (nodes)"
              min={1}
              max={minAppMax}
              value={[minApp, maxApp]}
              onChange={([lo, hi]) => {
                setMinApp(lo)
                setMaxApp(hi)
              }}
              onCommit={() => buildGraph()}
            />

            {/* Co-appearance range slider */}
            <RangeSlider
              label="Co-appearances (edges)"
              min={1}
              max={minWtMax}
              value={[minWt, maxWt]}
              onChange={([lo, hi]) => {
                setMinWt(lo)
                setMaxWt(hi)
              }}
              onCommit={() => buildGraph()}
            />
            {/* Max edges */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Max edges
              </label>
              <input
                type="number"
                min={50}
                max={10000}
                step={50}
                value={maxEdges}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setMaxEdges(Number(e.target.value))}
                onBlur={() => buildGraph()}
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Find character
              </label>
              <div className="flex gap-2">
                <input
                  list="charList"
                  type="text"
                  value={search}
                  placeholder="Type a name…"
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && focusCharacter()}
                />
                <datalist id="charList">
                  {allNodesRef.current.map((n) => (
                    <option key={n.id} value={n.name} />
                  ))}
                </datalist>
                <button
                  onClick={focusCharacter}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Focus
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons + stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => buildGraph()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Apply filters
              </button>
              <button
                onClick={fitView}
                className="px-4 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
              >
                Fit / Reset view
              </button>
              {/* Community toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none ml-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showCommunities}
                    onChange={(e) => {
                      setShowCommunities(e.target.checked)
                      buildGraph(
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        e.target.checked
                      )
                    }}
                  />
                  <div
                    className={`w-9 h-5 rounded-full transition-colors ${showCommunities ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showCommunities ? 'translate-x-4' : ''}`}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  Color by community
                </span>
              </label>
              {showCommunities && communityCount > 0 && (
                <span className="text-xs text-gray-400">
                  {communityCount} communities detected
                </span>
              )}
            </div>

            {stats && (
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
                  <span className="font-semibold text-blue-600">
                    {stats.nodesShown.toLocaleString()}
                  </span>{' '}
                  characters
                  <span className="text-gray-400 ml-1">
                    / {stats.totalEligible.toLocaleString()} eligible
                  </span>
                </span>
                <span className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
                  <span className="font-semibold text-indigo-600">
                    {stats.edgesShown.toLocaleString()}
                  </span>{' '}
                  connections
                </span>
                <span className="text-xs text-gray-400 self-center">
                  {status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Graph canvas ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10 gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-500">Loading network data…</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 font-medium">
                  Failed to load network
                </p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          <div
            ref={containerRef}
            style={{ width: '100%', height: '70vh', minHeight: 500 }}
          />

          {/* Node click popup */}
          {selectedNode &&
            (() => {
              const nodeId = selectedNode.id
              const neighbors = activeEdgesRef.current
                .filter((e) => e.source === nodeId || e.target === nodeId)
                .map((e) => ({
                  name: e.source === nodeId ? e.target_name : e.source_name,
                  weight: e.weight,
                }))
                .sort((a, b) => b.weight - a.weight)
              return (
                <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-10 w-64 max-h-[60vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                      {selectedNode.name}
                    </h4>
                    <button
                      onClick={() => deselectNode()}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0 -mt-0.5"
                      aria-label="Close"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Stats */}
                  <dl className="text-xs text-gray-600 space-y-1 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-400">Appearances</dt>
                      <dd className="font-semibold text-gray-800">
                        {selectedNode.appearance_count.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-400">Connections shown</dt>
                      <dd className="font-semibold text-gray-800">
                        {neighbors.length.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-400">Weighted degree</dt>
                      <dd className="font-semibold text-gray-800">
                        {selectedNode.weighted_degree.toLocaleString()}
                      </dd>
                    </div>
                  </dl>

                  {/* Connected nodes list */}
                  {neighbors.length > 0 && (
                    <>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Connected characters
                      </p>
                      <div className="overflow-y-auto flex-1 -mx-1 px-1">
                        {neighbors.map((nb) => (
                          <div
                            key={nb.name}
                            className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0"
                          >
                            <span className="text-xs text-gray-700 truncate mr-2">
                              {nb.name}
                            </span>
                            <span className="text-xs font-semibold text-blue-600 flex-shrink-0">
                              {nb.weight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
        </div>

        {showCommunities && communityGroups.length > 0 && (
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Communities · {communityGroups.length} detected
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {communityGroups.map(({ communityIndex, nodes }) => {
                const color =
                  COMMUNITY_COLORS[communityIndex % COMMUNITY_COLORS.length]
                return (
                  <div
                    key={communityIndex}
                    className="border border-gray-100 rounded-lg overflow-hidden"
                  >
                    {/* Community header */}
                    <div
                      className="flex items-center gap-2 px-3 py-2"
                      style={{
                        backgroundColor: color + '18',
                        borderBottom: `2px solid ${color}`,
                      }}
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        Community {communityIndex + 1}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {nodes.length} chars
                      </span>
                    </div>
                    {/* Character list */}
                    <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                      {nodes.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => focusNodeById(n.id)}
                          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <span className="text-xs text-gray-700 truncate mr-2">
                            {n.name}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {n.appearance_count.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-400 text-center">
          Scroll to zoom · Drag to pan · Click a node for details · Use keyboard
          arrows to navigate
        </p>
      </div>
    </div>
  )
}
