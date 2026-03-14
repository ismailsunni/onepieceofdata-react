import { useEffect, useRef, useState, useCallback } from 'react'
import { Network, DataSet } from 'vis-network/standalone'

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
  minApp: number
  minWt: number
  edgeCap: number
  totalEligible: number
}

// ─── CSV parser (no dep) ───────────────────────────────────────────────────────
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
  const [status, setStatus] = useState('Loading...')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Build / refresh graph ───────────────────────────────────────────────────
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
          title: `<b>${n.name}</b><br>Appearances: ${n.appearance_count}<br>Weighted degree: ${n.weighted_degree}`,
          color: {
            background: '#5aa8ff',
            border: '#3468a8',
            highlight: { background: '#ffcc44', border: '#cc8800' },
            hover: { background: '#7ec8ff', border: '#3468a8' },
          },
          font: { color: '#e5ecff', size: 11 },
        }))

      const visEdges = filteredEdges.map((e) => ({
        from: e.source,
        to: e.target,
        width: Math.max(1, Math.min(6, Math.log10(Math.max(1, e.weight)) * 2)),
        title: `${e.source_name} + ${e.target_name}: ${e.weight} chapters`,
        color: {
          color: '#4a7fcc',
          opacity: 0.5,
          highlight: '#ffcc44',
          hover: '#7ec8ff',
        },
      }))

      setStats({
        nodesShown: visNodes.length,
        edgesShown: visEdges.length,
        minApp: mA,
        minWt: mW,
        edgeCap: mE,
        totalEligible: eligible.length,
      })
      setStatus(`${visNodes.length} nodes / ${visEdges.length} edges`)

      if (visNodes.length === 0) {
        if (networkRef.current) {
          networkRef.current.destroy()
          networkRef.current = null
        }
        setStatus('No nodes match filters — lower the sliders')
        return
      }

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
          layout: {
            randomSeed: 7,
            improvedLayout: visNodes.length < 80,
          },
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
          `${visNodes.length} nodes / ${visEdges.length} edges · stabilized`
        )
      })

      networkRef.current = net
    },
    [minApp, minWt, maxEdges]
  )

  // ── Load CSVs on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    setStatus('Fetching data...')
    let nodesDone = false
    let edgesDone = false
    let rawN: RawNode[] = []
    let rawE: RawEdge[] = []

    function tryBuild() {
      if (!nodesDone || !edgesDone) return
      allNodesRef.current = rawN
      allEdgesRef.current = rawE
      nameToIdRef.current = {}
      rawN.forEach((n) => (nameToIdRef.current[n.name] = n.id))

      const maxApp = Math.max(...rawN.map((n) => n.appearance_count), 11)
      const maxWt = Math.max(...rawE.map((e) => e.weight), 1)
      setMinAppMax(maxApp)
      setMinWtMax(maxWt)
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

  // ── Focus character ─────────────────────────────────────────────────────────
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

  const fitView = () => {
    if (networkRef.current) networkRef.current.fit({ animation: true })
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: 'calc(100vh - 64px)',
        background: '#0b1020',
        color: '#e5ecff',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
        overflow: 'hidden',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: 300,
          flexShrink: 0,
          background: '#121a30',
          borderRight: '1px solid #273455',
          padding: 14,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
            Network Controls
          </h1>
          <small style={{ color: '#7a90b8', fontSize: 11 }}>
            One Piece · chapter co-appearances
          </small>
        </div>

        {/* Min appearances */}
        <div>
          <label
            style={{
              display: 'block',
              color: '#9db0d1',
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            Min chapter appearances (node filter)
          </label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="range"
              min={1}
              max={minAppMax}
              value={minApp}
              style={{ flex: 1, accentColor: '#5aa8ff' }}
              onChange={(e) => setMinApp(Number(e.target.value))}
              onMouseUp={() => buildGraph()}
              onTouchEnd={() => buildGraph()}
            />
            <span
              style={{
                width: 36,
                textAlign: 'right',
                color: '#5aa8ff',
                fontWeight: 600,
              }}
            >
              {minApp}
            </span>
          </div>
        </div>

        {/* Min edge weight */}
        <div>
          <label
            style={{
              display: 'block',
              color: '#9db0d1',
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            Min co-appearance weight (edge filter)
          </label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="range"
              min={1}
              max={minWtMax}
              value={minWt}
              style={{ flex: 1, accentColor: '#5aa8ff' }}
              onChange={(e) => setMinWt(Number(e.target.value))}
              onMouseUp={() => buildGraph()}
              onTouchEnd={() => buildGraph()}
            />
            <span
              style={{
                width: 36,
                textAlign: 'right',
                color: '#5aa8ff',
                fontWeight: 600,
              }}
            >
              {minWt}
            </span>
          </div>
        </div>

        {/* Max edges */}
        <div>
          <label
            style={{
              display: 'block',
              color: '#9db0d1',
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            Max edges rendered
          </label>
          <input
            type="number"
            min={50}
            max={10000}
            step={50}
            value={maxEdges}
            onChange={(e) => setMaxEdges(Number(e.target.value))}
            onBlur={() => buildGraph()}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #273455',
              borderRadius: 6,
              background: '#0e1630',
              color: '#e5ecff',
              fontSize: 12,
            }}
          />
        </div>

        {/* Search */}
        <div>
          <label
            style={{
              display: 'block',
              color: '#9db0d1',
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            Find character
          </label>
          <input
            list="charList"
            type="text"
            value={search}
            placeholder="Type a name..."
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && focusCharacter()}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #273455',
              borderRadius: 6,
              background: '#0e1630',
              color: '#e5ecff',
              fontSize: 12,
            }}
          />
          <datalist id="charList">
            {allNodesRef.current.map((n) => (
              <option key={n.id} value={n.name} />
            ))}
          </datalist>
        </div>

        {/* Buttons */}
        {[
          { label: 'Focus character', action: focusCharacter },
          { label: 'Apply filters', action: () => buildGraph() },
          { label: 'Fit / Reset view', action: fitView },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              width: '100%',
              padding: '7px 0',
              border: '1px solid #273455',
              borderRadius: 6,
              background: '#1a2a4a',
              color: '#e5ecff',
              cursor: 'pointer',
              fontSize: 12,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.background = '#223560')
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.background = '#1a2a4a')
            }
          >
            {label}
          </button>
        ))}

        {/* Stats */}
        {stats && (
          <div
            style={{
              background: '#0e1630',
              border: '1px solid #273455',
              borderRadius: 6,
              padding: 8,
              lineHeight: 1.7,
              color: '#9db0d1',
              fontSize: 11,
              whiteSpace: 'pre',
            }}
          >
            {`Nodes shown:      ${stats.nodesShown}
Edges shown:      ${stats.edgesShown}
Min appearances:  ${stats.minApp}
Min edge weight:  ${stats.minWt}
Edge cap:         ${stats.edgeCap}
Total eligible:   ${stats.totalEligible}`}
          </div>
        )}
      </aside>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Topbar */}
        <div
          style={{
            flexShrink: 0,
            height: 40,
            padding: '0 14px',
            background: '#0e1630',
            borderBottom: '1px solid #273455',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong style={{ fontSize: 13 }}>
            One Piece Character Co-Appearance Explorer
          </strong>
          <span style={{ color: '#5aa8ff', fontSize: 12 }}>{status}</span>
        </div>

        {/* Network canvas */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#0b1020',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                zIndex: 10,
                color: '#9db0d1',
                fontSize: 15,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: '3px solid #273455',
                  borderTopColor: '#5aa8ff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Loading network data...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {error && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff8ca8',
                fontSize: 14,
                zIndex: 10,
              }}
            >
              Failed to load: {error}
            </div>
          )}
          <div
            ref={containerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        </div>
      </div>
    </div>
  )
}
