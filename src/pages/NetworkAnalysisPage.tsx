import { useEffect, useRef, useState, useCallback } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import { circular } from 'graphology-layout'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { SectionHeader } from '../components/analytics'

// Network dataset options
const NETWORK_DATASETS = [
  { id: 'arc', label: 'By Arc', description: 'Characters co-appearing in the same arc' },
  { id: 'saga', label: 'By Saga', description: 'Characters co-appearing in the same saga' },
  { id: 'chapter', label: 'By Chapter', description: 'Characters co-appearing in the same chapter' },
  { id: 'consec-2', label: 'Consecutive (2)', description: 'Characters co-appearing in 2 consecutive chapters' },
  { id: 'consec-3', label: 'Consecutive (3)', description: 'Characters co-appearing in 3 consecutive chapters' },
  { id: 'consec-5', label: 'Consecutive (5)', description: 'Characters co-appearing in 5 consecutive chapters' },
  { id: 'consec-7', label: 'Consecutive (7)', description: 'Characters co-appearing in 7 consecutive chapters' },
]

interface NetworkNode {
  id: string
  label: string
  appearance_count: number
}

interface NetworkEdge {
  source: string
  target: string
  weight: number
}

interface NetworkData {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

// Color palette for node degrees
const NODE_COLORS = [
  '#3b82f6', // blue - low degree
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red - high degree
]

function getNodeColor(degree: number, maxDegree: number): string {
  const ratio = degree / maxDegree
  if (ratio < 0.25) return NODE_COLORS[0]
  if (ratio < 0.5) return NODE_COLORS[1]
  if (ratio < 0.75) return NODE_COLORS[2]
  return NODE_COLORS[3]
}

function NetworkAnalysisPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)

  const [selectedDataset, setSelectedDataset] = useState('saga')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ nodes: number; edges: number } | null>(null)
  const [hoveredNode, setHoveredNode] = useState<{ label: string; degree: number; appearances: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [minWeight, setMinWeight] = useState(1)
  const [isLayoutRunning, setIsLayoutRunning] = useState(false)
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildGraph = useCallback(async (datasetId: string, weightThreshold: number) => {
    setIsLoading(true)
    setError(null)
    setHoveredNode(null)

    try {
      const res = await fetch(`/network_${datasetId}.json`)
      if (!res.ok) throw new Error(`Failed to load network data: ${res.statusText}`)
      const data: NetworkData = await res.json()

      // Filter edges by weight
      const filteredEdges = data.edges.filter((e) => e.weight >= weightThreshold)

      // Only include nodes that are referenced in filtered edges
      const referencedNodes = new Set<string>()
      filteredEdges.forEach((e) => {
        referencedNodes.add(e.source)
        referencedNodes.add(e.target)
      })
      const filteredNodes = data.nodes.filter((n) => referencedNodes.has(n.id))

      const graph = new Graph({ type: 'undirected', multi: false })

      // Add nodes
      filteredNodes.forEach((node) => {
        if (!graph.hasNode(node.id)) {
          graph.addNode(node.id, {
            label: node.label,
            appearance_count: node.appearance_count,
            x: Math.random(),
            y: Math.random(),
            size: Math.max(4, Math.min(20, Math.log(node.appearance_count + 1) * 2)),
            color: '#3b82f6',
          })
        }
      })

      // Add edges
      filteredEdges.forEach((edge) => {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
          const key = [edge.source, edge.target].sort().join('|')
          if (!graph.hasEdge(edge.source, edge.target)) {
            graph.addEdge(edge.source, edge.target, {
              weight: edge.weight,
              size: Math.max(0.3, Math.min(3, Math.log(edge.weight + 1) * 0.5)),
              color: '#cbd5e1',
              key,
            })
          }
        }
      })

      // Compute degree-based colors
      const degrees = graph.nodes().map((n) => graph.degree(n))
      const maxDegree = Math.max(...degrees, 1)
      graph.nodes().forEach((nodeId) => {
        const degree = graph.degree(nodeId)
        graph.setNodeAttribute(nodeId, 'color', getNodeColor(degree, maxDegree))
      })

      // Apply circular layout first, then run ForceAtlas2
      circular.assign(graph, { scale: 1 })

      setStats({ nodes: graph.order, edges: graph.size })
      return graph
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const initSigma = useCallback((graph: Graph) => {
    if (!containerRef.current) return

    // Destroy existing instance
    if (sigmaRef.current) {
      sigmaRef.current.kill()
      sigmaRef.current = null
    }

    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeColor: '#cbd5e1',
      defaultNodeColor: '#3b82f6',
      minCameraRatio: 0.05,
      maxCameraRatio: 10,
      labelRenderedSizeThreshold: 8,
    })

    // Hover events
    sigma.on('enterNode', ({ node }) => {
      const attrs = graph.getNodeAttributes(node)
      setHoveredNode({
        label: attrs.label as string,
        degree: graph.degree(node),
        appearances: attrs.appearance_count as number,
      })
      // Highlight neighbors
      graph.nodes().forEach((n) => {
        if (n === node || graph.neighbors(node).includes(n)) {
          graph.setNodeAttribute(n, 'highlighted', true)
        }
      })
      sigma.refresh()
    })

    sigma.on('leaveNode', () => {
      setHoveredNode(null)
      graph.nodes().forEach((n) => graph.removeNodeAttribute(n, 'highlighted'))
      sigma.refresh()
    })

    sigmaRef.current = sigma
    graphRef.current = graph
  }, [])

  // Run ForceAtlas2 layout animation
  const runLayout = useCallback(() => {
    if (!graphRef.current || !sigmaRef.current) return
    setIsLayoutRunning(true)

    let iterations = 0
    const maxIterations = 200
    const batchSize = 10

    const step = () => {
      if (!graphRef.current || !sigmaRef.current) return
      forceAtlas2.assign(graphRef.current, { iterations: batchSize, settings: { gravity: 1, scalingRatio: 5 } })
      sigmaRef.current.refresh()
      iterations += batchSize
      if (iterations < maxIterations) {
        layoutTimerRef.current = setTimeout(step, 16)
      } else {
        setIsLayoutRunning(false)
      }
    }
    step()
  }, [])

  // Stop layout
  const stopLayout = useCallback(() => {
    if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current)
    setIsLayoutRunning(false)
  }, [])

  // Load & render on dataset / weight change
  useEffect(() => {
    buildGraph(selectedDataset, minWeight).then((graph) => {
      if (graph) initSigma(graph)
    })
    return () => {
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current)
    }
  }, [selectedDataset, minWeight, buildGraph, initSigma])

  // Search: highlight matching node
  useEffect(() => {
    if (!graphRef.current || !sigmaRef.current) return
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      graphRef.current.nodes().forEach((n) => graphRef.current!.removeNodeAttribute(n, 'highlighted'))
    } else {
      graphRef.current.nodes().forEach((n) => {
        const label = (graphRef.current!.getNodeAttribute(n, 'label') as string).toLowerCase()
        if (label.includes(query)) {
          graphRef.current!.setNodeAttribute(n, 'highlighted', true)
          graphRef.current!.setNodeAttribute(n, 'color', '#f97316')
        } else {
          graphRef.current!.removeNodeAttribute(n, 'highlighted')
          const degree = graphRef.current!.degree(n)
          const maxDegree = Math.max(...graphRef.current!.nodes().map((nn) => graphRef.current!.degree(nn)), 1)
          graphRef.current!.setNodeAttribute(n, 'color', getNodeColor(degree, maxDegree))
        }
      })
    }
    sigmaRef.current.refresh()
  }, [searchQuery])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sigmaRef.current) sigmaRef.current.kill()
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader
          title="Character Network Analysis"
          description="Explore how One Piece characters are connected through co-appearances. Nodes represent characters, edges represent shared appearances."
        />

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Dataset selector */}
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Network Type</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NETWORK_DATASETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label} — {d.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Min weight filter */}
            <div className="min-w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min. Co-appearances: <span className="font-bold text-blue-600">{minWeight}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={minWeight}
                onChange={(e) => setMinWeight(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Search */}
            <div className="min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Character</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Luffy, Zoro…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Layout controls */}
            <div className="flex gap-2">
              <button
                onClick={runLayout}
                disabled={isLoading || isLayoutRunning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLayoutRunning ? 'Running…' : '▶ Run Layout'}
              </button>
              {isLayoutRunning && (
                <button
                  onClick={stopLayout}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  ⏹ Stop
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {stats && !isLoading && (
          <div className="flex gap-4 mb-4 text-sm text-gray-600">
            <span className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
              <span className="font-semibold text-blue-600">{stats.nodes.toLocaleString()}</span> characters
            </span>
            <span className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
              <span className="font-semibold text-purple-600">{stats.edges.toLocaleString()}</span> connections
            </span>
            {hoveredNode && (
              <span className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 shadow-sm text-orange-700">
                <span className="font-semibold">{hoveredNode.label}</span> — {hoveredNode.degree} connections,{' '}
                {hoveredNode.appearances.toLocaleString()} appearances
              </span>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {['Low connectivity', 'Medium', 'High', 'Very high'].map((label, i) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS[i] }}
              />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
            Search match
          </span>
        </div>

        {/* Canvas container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                <p className="text-sm text-gray-600">Loading network…</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 font-medium">Failed to load network</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          <div
            ref={containerRef}
            style={{ width: '100%', height: '70vh', minHeight: '500px' }}
          />
        </div>

        {/* Help text */}
        <p className="mt-3 text-xs text-gray-500 text-center">
          Scroll to zoom · Drag to pan · Hover a node for details · Use "Run Layout" to spread the network with ForceAtlas2
        </p>
      </div>
    </div>
  )
}

export default NetworkAnalysisPage
