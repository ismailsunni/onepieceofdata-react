import { useEffect, useRef, useState, useCallback } from 'react'
import { Network, DataSet } from 'vis-network/standalone'
import { SectionHeader } from '../components/analytics'

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

// ─── Component ────────────────────────────────────────────────────────────────
export default function NetworkAnalysisPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const allNodesRef = useRef<RawNode[]>([])
  const allEdgesRef = useRef<RawEdge[]>([])
  const nameToIdRef = useRef<Record<string, string>>({})

  const [minApp, setMinApp] = useState(11)
  const [minAppMax, setMinAppMax] = useState(1001)
  const [minWt, setMinWt] = useState(10)
  const [minWtMax, setMinWtMax] = useState(762)
  const [maxEdges, setMaxEdges] = useState(500)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [status, setStatus] = useState('Loading…')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Build / refresh graph ────────────────────────────────────────────────────
  const buildGraph = useCallback(
    (
      overrideMinApp?: number,
      overrideMinWt?: number,
      overrideMaxEdges?: number
    ) => {
      if (!containerRef.current) return
      const mA = overrideMinApp ?? minApp
      const mW = overrideMinWt ?? minWt
      const mE = overrideMaxEdges ?? maxEdges

      const eligible = allNodesRef.current.filter(
        (n) => n.appearance_count >= mA
      )
      const allowed = new Set(eligible.map((n) => n.id))

      const filteredEdges = allEdgesRef.current
        .filter(
          (e) =>
            e.weight >= mW && allowed.has(e.source) && allowed.has(e.target)
        )
        .sort((a, b) => b.weight - a.weight)
        .slice(0, mE)

      const seen = new Set<string>()
      filteredEdges.forEach((e) => {
        seen.add(e.source)
        seen.add(e.target)
      })

      const visNodes = eligible
        .filter((n) => seen.has(n.id))
        .map((n) => ({
          id: n.id,
          label: n.name,
          size: Math.max(
            8,
            Math.min(28, 8 + Math.log10(Math.max(1, n.appearance_count)) * 7)
          ),
          title: `<div style="font-family:sans-serif;font-size:12px;padding:4px 6px;line-height:1.6">
            <strong>${n.name}</strong><br/>
            Appearances: ${n.appearance_count.toLocaleString()}<br/>
            Connections: ${n.degree}
          </div>`,
          color: {
            background: '#3b82f6',
            border: '#1d4ed8',
            highlight: { background: '#f59e0b', border: '#d97706' },
            hover: { background: '#60a5fa', border: '#1d4ed8' },
          },
          font: { color: '#1f2937', size: 11 },
        }))

      const visEdges = filteredEdges.map((e) => ({
        from: e.source,
        to: e.target,
        width: Math.max(
          1,
          Math.min(5, Math.log10(Math.max(1, e.weight)) * 1.8)
        ),
        title: `<div style="font-family:sans-serif;font-size:12px;padding:4px 6px">
          <strong>${e.source_name}</strong> + <strong>${e.target_name}</strong><br/>
          ${e.weight} co-appearances
        </div>`,
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
        {
          nodes: new DataSet(visNodes as never[]),
          edges: new DataSet(visEdges as never[]),
        },
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
        net.fit({ animation: true })
        setStatus(
          `${visNodes.length} nodes · ${visEdges.length} edges · stabilized`
        )
      })

      networkRef.current = net
    },
    [minApp, minWt, maxEdges]
  )

  // ── Load CSVs on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    let nodesDone = false
    let edgesDone = false
    let rawN: RawNode[] = []
    let rawE: RawEdge[] = []

    function tryBuild() {
      if (!nodesDone || !edgesDone) return
      allNodesRef.current = rawN
      allEdgesRef.current = rawE
      rawN.forEach((n) => (nameToIdRef.current[n.name] = n.id))
      setMinAppMax(Math.max(...rawN.map((n) => n.appearance_count), 11))
      setMinWtMax(Math.max(...rawE.map((e) => e.weight), 1))
      setIsLoading(false)
      buildGraph(11, 10, 500)
    }

    fetch('/character_network_nodes_gt10.csv')
      .then((r) => r.text())
      .then((text) => {
        rawN = parseCsv(text)
          .map((r) => ({
            id: r.id ?? '',
            name: r.name ?? r.id ?? '',
            appearance_count: Number(r.appearance_count) || 0,
            weighted_degree: Number(r.weighted_degree) || 0,
            degree: Number(r.degree) || 0,
          }))
          .filter((n) => n.id)
        nodesDone = true
        tryBuild()
      })
      .catch((e) => setError(String(e)))

    fetch('/character_coappearance_edges_gt10.csv')
      .then((r) => r.text())
      .then((text) => {
        rawE = parseCsv(text)
          .map((r) => ({
            source: r.source ?? '',
            source_name: r.source_name ?? r.source ?? '',
            target: r.target ?? '',
            target_name: r.target_name ?? r.target ?? '',
            weight: Number(r.weight) || 0,
          }))
          .filter((e) => e.source && e.target)
        edgesDone = true
        tryBuild()
      })
      .catch((e) => setError(String(e)))

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Focus character ───────────────────────────────────────────────────────────
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SectionHeader
          title="Character Network Analysis"
          description="Explore how One Piece characters are connected through chapter co-appearances. Node size reflects appearance count; edge width reflects co-appearance frequency."
        />

        {/* ── Controls card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
            {/* Min appearances */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Min appearances (nodes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={minAppMax}
                  value={minApp}
                  className="flex-1 accent-blue-600"
                  onChange={(e) => setMinApp(Number(e.target.value))}
                  onMouseUp={() => buildGraph()}
                  onTouchEnd={() => buildGraph()}
                />
                <span className="w-10 text-right text-sm font-semibold text-blue-600">
                  {minApp}
                </span>
              </div>
            </div>

            {/* Min edge weight */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Min co-appearances (edges)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={minWtMax}
                  value={minWt}
                  className="flex-1 accent-blue-600"
                  onChange={(e) => setMinWt(Number(e.target.value))}
                  onMouseUp={() => buildGraph()}
                  onTouchEnd={() => buildGraph()}
                />
                <span className="w-10 text-right text-sm font-semibold text-blue-600">
                  {minWt}
                </span>
              </div>
            </div>

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

            {/* Search + buttons */}
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

          {/* Second row: action buttons + stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
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
            </div>

            {stats && (
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
                  <span className="font-semibold text-blue-600">
                    {stats.nodesShown.toLocaleString()}
                  </span>{' '}
                  characters shown
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

        {/* ── Graph card ────────────────────────────────────────────────── */}
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
        </div>

        <p className="mt-3 text-xs text-gray-400 text-center">
          Scroll to zoom · Drag to pan · Hover a node or edge for details · Use
          keyboard arrows to navigate
        </p>
      </div>
    </div>
  )
}
