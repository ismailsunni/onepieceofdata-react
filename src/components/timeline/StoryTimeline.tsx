import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Network, DataSet } from 'vis-network/standalone'
import { useTimelineData, SAGA_COLORS } from '../../hooks/useTimelineData'
import TimelineModal, { type TimelineSelection } from './TimelineModal'
import type { Character } from '../../types/character'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Level = 'saga' | 'arc' | 'chapter'

interface View {
  level: Level
  sagaId: string | null
  arcId: string | null
}

const GOLDEN_ANGLE = 2.399963229728653

function hexToRgba(hex: string, a: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

interface GraphItem {
  id: string
  number: number
  title: string
  color: string
  isLeaf: boolean
  isContext: boolean
  side?: 'prev' | 'next'
  sel: TimelineSelection
  drill: () => void
}

/**
 * Interactive Story Timeline as a graph that fills the canvas at every level.
 *
 * - Saga level: a force-directed chain of big saga nodes (chronological).
 * - Click a saga → fly in to its arc scene: the arcs packed inside a big saga
 *   circle, linked in order, with the neighbouring sagas to either side.
 * - Click an arc → its chapter scene, same idea.
 * Drag nodes, scroll to zoom, double-click for full details, breadcrumb to go
 * back (zooms out).
 */
export default function StoryTimeline() {
  const {
    sagas,
    arcs,
    chapters,
    characters,
    sagaColor,
    arcSagaId,
    isLoading,
    isError,
  } = useTimelineData()

  const [level, setLevel] = useState<Level>('saga')
  const [focusedSagaId, setFocusedSagaId] = useState<string | null>(null)
  const [focusedArcId, setFocusedArcId] = useState<string | null>(null)
  const [panelSel, setPanelSel] = useState<TimelineSelection | null>(null)
  const [modalSel, setModalSel] = useState<TimelineSelection | null>(null)

  // Navigation history (browser-style back / forward).
  const [hist, setHist] = useState<{ stack: View[]; i: number }>({
    stack: [{ level: 'saga', sagaId: null, arcId: null }],
    i: 0,
  })
  const canBack = hist.i > 0
  const canForward = hist.i < hist.stack.length - 1

  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)

  const focusedSaga = useMemo(
    () => sagas.find((s) => s.saga_id === focusedSagaId) ?? null,
    [sagas, focusedSagaId]
  )
  const focusedArc = useMemo(
    () => arcs.find((a) => a.arc_id === focusedArcId) ?? null,
    [arcs, focusedArcId]
  )

  const applyView = useCallback(
    (v: View) => {
      setLevel(v.level)
      setFocusedSagaId(v.sagaId)
      setFocusedArcId(v.arcId)
      // Default the side panel to the focused saga/arc so its detail is shown.
      if (v.level === 'arc' && v.sagaId) {
        const s = sagas.find((x) => x.saga_id === v.sagaId)
        setPanelSel(s ? { type: 'saga', saga: s } : null)
      } else if (v.level === 'chapter' && v.arcId) {
        const a = arcs.find((x) => x.arc_id === v.arcId)
        setPanelSel(a ? { type: 'arc', arc: a } : null)
      } else {
        setPanelSel(null)
      }
    },
    [sagas, arcs]
  )
  /** Navigate to a view and record it in history (drops any forward entries). */
  const pushView = useCallback(
    (v: View) => {
      setHist((h) => {
        const stack = h.stack.slice(0, h.i + 1)
        stack.push(v)
        return { stack, i: stack.length - 1 }
      })
      applyView(v)
    },
    [applyView]
  )

  const goToSagas = useCallback(
    () => pushView({ level: 'saga', sagaId: null, arcId: null }),
    [pushView]
  )
  const goToArcs = useCallback(
    (sagaId: string) => pushView({ level: 'arc', sagaId, arcId: null }),
    [pushView]
  )
  const goToChapters = useCallback(
    (sagaId: string, arcId: string) =>
      pushView({ level: 'chapter', sagaId, arcId }),
    [pushView]
  )

  const goBack = () => {
    if (hist.i <= 0) return
    const ni = hist.i - 1
    const v = hist.stack[ni]
    setHist((h) => ({ ...h, i: ni }))
    zoomOutThen(() => applyView(v))
  }
  const goForward = () => {
    if (hist.i >= hist.stack.length - 1) return
    const ni = hist.i + 1
    const v = hist.stack[ni]
    setHist((h) => ({ ...h, i: ni }))
    applyView(v)
  }
  const zoomOutThen = (fn: () => void) => {
    const net = networkRef.current
    if (!net) return fn()
    const scale = net.getScale?.() ?? 1
    net.moveTo({
      scale: Math.max(0.05, scale * 0.4),
      animation: { duration: 420, easingFunction: 'easeOutCubic' as any },
    })
    window.setTimeout(fn, 400)
  }

  const items: GraphItem[] = useMemo(() => {
    if (level === 'saga') {
      return sagas.map((s, i) => ({
        id: `saga:${s.saga_id}`,
        number: i + 1,
        title: s.title,
        color: SAGA_COLORS[i % SAGA_COLORS.length],
        isLeaf: false,
        isContext: false,
        sel: { type: 'saga', saga: s },
        drill: () => goToArcs(s.saga_id),
      }))
    }

    if (level === 'arc') {
      const sagaIdx = sagas.findIndex((s) => s.saga_id === focusedSagaId)
      const list = arcs.filter((a) => arcSagaId(a) === focusedSagaId)
      const out: GraphItem[] = []
      const prevSaga = sagaIdx > 0 ? sagas[sagaIdx - 1] : null
      if (prevSaga)
        out.push({
          id: `saga:${prevSaga.saga_id}`,
          number: sagaIdx,
          title: prevSaga.title,
          color: SAGA_COLORS[(sagaIdx - 1) % SAGA_COLORS.length],
          isLeaf: false,
          isContext: true,
          side: 'prev',
          sel: { type: 'saga', saga: prevSaga },
          drill: () => goToArcs(prevSaga.saga_id),
        })
      list.forEach((a, i) =>
        out.push({
          id: `arc:${a.arc_id}`,
          number: i + 1,
          title: a.title,
          color: sagaColor(arcSagaId(a)),
          isLeaf: false,
          isContext: false,
          sel: { type: 'arc', arc: a },
          drill: () => goToChapters(focusedSagaId!, a.arc_id),
        })
      )
      const nextSaga =
        sagaIdx >= 0 && sagaIdx < sagas.length - 1 ? sagas[sagaIdx + 1] : null
      if (nextSaga)
        out.push({
          id: `saga:${nextSaga.saga_id}`,
          number: sagaIdx + 2,
          title: nextSaga.title,
          color: SAGA_COLORS[(sagaIdx + 1) % SAGA_COLORS.length],
          isLeaf: false,
          isContext: true,
          side: 'next',
          sel: { type: 'saga', saga: nextSaga },
          drill: () => goToArcs(nextSaga.saga_id),
        })
      return out
    }

    if (!focusedArc) return []
    const color = sagaColor(arcSagaId(focusedArc))
    const arcsOfSaga = arcs.filter((a) => arcSagaId(a) === focusedSagaId)
    const arcIdx = arcsOfSaga.findIndex((a) => a.arc_id === focusedArcId)
    const out: GraphItem[] = []
    const prevArc = arcIdx > 0 ? arcsOfSaga[arcIdx - 1] : null
    if (prevArc)
      out.push({
        id: `arc:${prevArc.arc_id}`,
        number: arcIdx,
        title: prevArc.title,
        color: sagaColor(arcSagaId(prevArc)),
        isLeaf: false,
        isContext: true,
        side: 'prev',
        sel: { type: 'arc', arc: prevArc },
        drill: () => goToChapters(focusedSagaId!, prevArc.arc_id),
      })
    chapters
      .filter(
        (c) =>
          c.number >= focusedArc.start_chapter &&
          c.number <= focusedArc.end_chapter
      )
      .forEach((c) =>
        out.push({
          id: `chapter:${c.number}`,
          number: c.number,
          title: c.title || `Chapter ${c.number}`,
          color,
          isLeaf: true,
          isContext: false,
          sel: { type: 'chapter', chapter: c },
          drill: () => setModalSel({ type: 'chapter', chapter: c }),
        })
      )
    const nextArc =
      arcIdx >= 0 && arcIdx < arcsOfSaga.length - 1
        ? arcsOfSaga[arcIdx + 1]
        : null
    if (nextArc)
      out.push({
        id: `arc:${nextArc.arc_id}`,
        number: arcIdx + 2,
        title: nextArc.title,
        color: sagaColor(arcSagaId(nextArc)),
        isLeaf: false,
        isContext: true,
        side: 'next',
        sel: { type: 'arc', arc: nextArc },
        drill: () => goToChapters(focusedSagaId!, nextArc.arc_id),
      })
    return out
  }, [
    level,
    sagas,
    arcs,
    chapters,
    focusedSagaId,
    focusedArcId,
    focusedArc,
    arcSagaId,
    sagaColor,
    goToArcs,
    goToChapters,
  ])

  // ---- Build / rebuild the graph for the current level --------------------
  useEffect(() => {
    if (!containerRef.current || items.length === 0) return
    const byId = new Map(items.map((it) => [it.id, it]))
    const CONTAINER_ID = 'container'
    const nodeArr: any[] = []
    const edgeArr: any[] = []
    let usePhysics = false
    let smoothType = 'curvedCW'

    if (level === 'saga') {
      usePhysics = true
      smoothType = 'continuous'
      items.forEach((it) =>
        nodeArr.push({
          id: it.id,
          label: `${it.number}. ${it.title}`,
          shape: 'circle',
          color: {
            background: it.color,
            border: '#ffffff',
            highlight: { background: it.color, border: '#111827' },
          },
          borderWidth: 3,
          widthConstraint: { minimum: 70, maximum: 150 },
          margin: 14,
          font: { size: 17, color: '#ffffff', face: 'system-ui' },
        })
      )
      items.slice(1).forEach((it, i) =>
        edgeArr.push({
          id: `e${i}`,
          from: items[i].id,
          to: it.id,
          color: { color: '#cbd5e1', highlight: '#94a3b8' },
          width: 2.5,
          arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        })
      )
    } else {
      const children = items.filter((it) => !it.isContext)
      const neighbors = items.filter((it) => it.isContext)
      const parentColor = children[0]?.color ?? '#9ca3af'
      const parentTitle =
        level === 'arc' ? (focusedSaga?.title ?? '') : (focusedArc?.title ?? '')
      const isChapters = level === 'chapter'
      const childR = isChapters ? 16 : 30
      const c = childR * 2.7
      const R = Math.max(
        150,
        c * Math.sqrt(Math.max(1, children.length)) + childR + 36
      )

      nodeArr.push({
        id: CONTAINER_ID,
        label: '',
        shape: 'dot',
        size: R,
        x: 0,
        y: 0,
        fixed: true,
        color: {
          background: hexToRgba(parentColor, 0.1),
          border: parentColor,
          highlight: {
            background: hexToRgba(parentColor, 0.16),
            border: '#111827',
          },
        },
        borderWidth: 3,
        chosen: false,
      })

      // The focused saga/arc name, placed inside the container near the top
      // (above the children cluster).
      nodeArr.push({
        id: 'container-title',
        label: parentTitle,
        shape: 'text',
        x: 0,
        y: -(R - 30),
        fixed: true,
        widthConstraint: { maximum: Math.max(160, R * 1.3) },
        font: { size: 22, color: '#374151', face: 'system-ui' },
        chosen: false,
      })

      children.forEach((it, i) => {
        const rr = children.length <= 1 ? 0 : c * Math.sqrt(i + 0.5)
        const ang = (i + 0.5) * GOLDEN_ANGLE
        nodeArr.push({
          id: it.id,
          label: isChapters ? `${it.number}` : `${it.number}. ${it.title}`,
          title: `${it.number}. ${it.title}`,
          shape: 'circle',
          x: Math.cos(ang) * rr,
          y: Math.sin(ang) * rr,
          color: {
            background: it.color,
            border: '#ffffff',
            highlight: { background: it.color, border: '#111827' },
          },
          borderWidth: 2,
          widthConstraint: isChapters
            ? undefined
            : { minimum: 56, maximum: 120 },
          margin: isChapters ? 6 : 11,
          font: {
            size: isChapters ? 13 : 14,
            color: '#ffffff',
            face: 'system-ui',
          },
        })
      })
      children.slice(1).forEach((it, i) =>
        edgeArr.push({
          id: `ce${i}`,
          from: children[i].id,
          to: it.id,
          color: { color: '#94a3b8', highlight: '#475569' },
          width: 2,
          arrows: { to: { enabled: true, scaleFactor: 0.4 } },
        })
      )

      neighbors.forEach((it) => {
        nodeArr.push({
          id: it.id,
          label: `${it.number}. ${it.title}`,
          shape: 'circle',
          x: (it.side === 'prev' ? -1 : 1) * (R + 150),
          y: 0,
          fixed: true,
          color: {
            background: '#f1f5f9',
            border: it.color,
            highlight: { background: '#e2e8f0', border: '#111827' },
          },
          borderWidth: 2,
          shapeProperties: { borderDashes: [6, 4] },
          widthConstraint: { minimum: 60, maximum: 120 },
          margin: 12,
          font: { size: 14, color: '#475569', face: 'system-ui' },
        })
        // Connect the neighbour to the boundary arc so the chain stays
        // continuous: previous saga → first arc, last arc → next saga, with
        // the arrow pointing the way the story flows.
        if (children.length > 0) {
          const boundaryChild =
            it.side === 'prev' ? children[0] : children[children.length - 1]
          const from = it.side === 'prev' ? it.id : boundaryChild.id
          const to = it.side === 'prev' ? boundaryChild.id : it.id
          edgeArr.push({
            id: `cn-${it.id}`,
            from,
            to,
            color: { color: '#cbd5e1', highlight: '#94a3b8' },
            dashes: true,
            width: 2,
            arrows: { to: { enabled: true, scaleFactor: 0.45 } },
          })
        }
      })
    }

    const net = new Network(
      containerRef.current,
      {
        nodes: new DataSet(nodeArr as never[]),
        edges: new DataSet(edgeArr as never[]),
      },
      {
        physics: usePhysics
          ? {
              solver: 'forceAtlas2Based',
              forceAtlas2Based: {
                gravitationalConstant: -120,
                centralGravity: 0.012,
                springLength: 160,
                springConstant: 0.07,
              },
              stabilization: { iterations: 180 },
            }
          : false,
        interaction: {
          hover: true,
          tooltipDelay: 150,
          zoomView: true,
          dragView: true,
          dragNodes: true,
        },
        nodes: { borderWidth: 2 },
        edges: { smooth: { enabled: true, type: smoothType, roundness: 0.25 } },
      }
    )
    networkRef.current = net

    if (usePhysics) {
      net.once('stabilizationIterationsDone', () =>
        net.fit({ animation: true })
      )
    } else {
      window.setTimeout(() => net.fit({ animation: true }), 0)
    }

    const enter = (id: string, fn: () => void) => {
      net.focus(id, {
        scale: 2.2,
        animation: { duration: 460, easingFunction: 'easeInCubic' },
      })
      window.setTimeout(fn, 440)
    }

    // When nothing is clicked, fall back to the focused saga/arc's detail.
    const focusSel: TimelineSelection | null =
      level === 'arc' && focusedSaga
        ? { type: 'saga', saga: focusedSaga }
        : level === 'chapter' && focusedArc
          ? { type: 'arc', arc: focusedArc }
          : null

    net.on('click', (params: any) => {
      if (!params.nodes || params.nodes.length === 0) {
        setPanelSel(focusSel)
        return
      }
      const id = String(params.nodes[0])
      if (id === CONTAINER_ID) {
        if (level === 'arc') zoomOutThen(goToSagas)
        else if (level === 'chapter' && focusedSagaId)
          zoomOutThen(() => goToArcs(focusedSagaId))
        return
      }
      const it = byId.get(id)
      if (!it) return
      setPanelSel(it.sel)
      if (it.isLeaf) {
        setModalSel(it.sel)
        return
      }
      enter(id, it.drill)
    })
    net.on('doubleClick', (params: any) => {
      if (!params.nodes || params.nodes.length === 0) return
      const it = byId.get(String(params.nodes[0]))
      if (it) setModalSel(it.sel)
    })

    return () => {
      net.destroy()
      networkRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  if (isError) {
    return (
      <div className="py-12 text-center text-gray-500">
        Could not load timeline data. Please try again later.
      </div>
    )
  }
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-[560px] w-full bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              disabled={!canBack}
              aria-label="Back"
              title="Back"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <button
              onClick={goForward}
              disabled={!canForward}
              aria-label="Forward"
              title="Forward"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
            <button
              onClick={() => networkRef.current?.fit({ animation: true })}
              aria-label="Fit view"
              title="Fit view"
              className="px-3 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Fit
            </button>
          </div>
          <nav
            className="flex items-center flex-wrap gap-1 text-sm"
            aria-label="Timeline breadcrumb"
          >
            <button
              onClick={() => level !== 'saga' && zoomOutThen(goToSagas)}
              className={`px-2 py-1 rounded transition-colors ${
                level === 'saga'
                  ? 'font-semibold text-gray-900'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              All Sagas
            </button>
            {focusedSaga && (
              <>
                <span className="text-gray-300">›</span>
                <button
                  onClick={() =>
                    level === 'chapter' &&
                    zoomOutThen(() => goToArcs(focusedSaga.saga_id))
                  }
                  className={`px-2 py-1 rounded transition-colors ${
                    level === 'arc'
                      ? 'font-semibold text-gray-900'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {focusedSaga.title}
                </button>
              </>
            )}
            {level === 'chapter' && focusedArc && (
              <>
                <span className="text-gray-300">›</span>
                <span className="px-2 py-1 font-semibold text-gray-900">
                  {focusedArc.title}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <div ref={containerRef} className="w-full h-[560px]" />
        </div>

        <aside>
          {panelSel ? (
            <PanelCard
              selection={panelSel}
              characters={characters}
              onOpenDetails={() => setModalSel(panelSel)}
            />
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
              <p className="font-medium mb-2">Explore the story timeline</p>
              <ul className="space-y-1.5 text-xs leading-relaxed text-blue-800">
                <li>· All sagas are linked in chronological order.</li>
                <li>· Click a saga to fly into its arcs (shown inside it).</li>
                <li>· Click an arc to fly into its chapters.</li>
                <li>
                  · Dashed neighbours jump to the next/previous saga or arc.
                </li>
                <li>
                  · Drag nodes, scroll to zoom; double-click for full details.
                </li>
              </ul>
            </div>
          )}
        </aside>
      </div>

      {modalSel && (
        <TimelineModal
          selection={modalSel}
          characters={characters}
          onClose={() => setModalSel(null)}
        />
      )}
    </div>
  )
}

/** Compact summary card shown in the side panel for the clicked node. */
function PanelCard({
  selection,
  characters,
  onOpenDetails,
}: {
  selection: TimelineSelection
  characters: Character[]
  onOpenDetails: () => void
}) {
  const meta =
    selection.type === 'saga'
      ? {
          label: 'Saga',
          title: selection.saga.title,
          sub: selection.saga.japanese_title,
          range: `Ch. ${selection.saga.start_chapter}–${selection.saga.end_chapter}`,
          chapterCount:
            selection.saga.end_chapter - selection.saga.start_chapter + 1,
          desc: selection.saga.description,
          detailPath: `/sagas/${selection.saga.saga_id}`,
        }
      : selection.type === 'arc'
        ? {
            label: 'Arc',
            title: selection.arc.title,
            sub: selection.arc.japanese_title,
            range: `Ch. ${selection.arc.start_chapter}–${selection.arc.end_chapter}`,
            chapterCount:
              selection.arc.end_chapter - selection.arc.start_chapter + 1,
            desc: selection.arc.description,
            detailPath: `/arcs/${selection.arc.arc_id}`,
          }
        : {
            label: 'Chapter',
            title: selection.chapter.title
              ? `Ch. ${selection.chapter.number}: ${selection.chapter.title}`
              : `Chapter ${selection.chapter.number}`,
            sub: null,
            range:
              selection.chapter.volume != null
                ? `Volume ${selection.chapter.volume}`
                : `Chapter ${selection.chapter.number}`,
            chapterCount: null,
            desc: null,
            detailPath: `/chapters/${selection.chapter.number}`,
          }

  // Top characters appearing in this saga/arc (by appearances within its range).
  const topChars = useMemo(() => {
    if (selection.type === 'chapter') {
      const n = selection.chapter.number
      return characters
        .filter((c) => c.chapter_list?.includes(n))
        .sort((a, b) => (b.appearance_count ?? 0) - (a.appearance_count ?? 0))
        .slice(0, 8)
        .map((c) => ({ c, count: 0 }))
    }
    const start =
      selection.type === 'saga'
        ? selection.saga.start_chapter
        : selection.arc.start_chapter
    const end =
      selection.type === 'saga'
        ? selection.saga.end_chapter
        : selection.arc.end_chapter
    return characters
      .map((c) => ({
        c,
        count:
          c.chapter_list?.filter((ch) => ch >= start && ch <= end).length ?? 0,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [selection, characters])

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
        {meta.label}
      </div>
      <div className="text-base font-semibold text-gray-900 leading-tight">
        {meta.title}
      </div>
      {meta.sub && (
        <div className="text-sm text-gray-500 mt-0.5">{meta.sub}</div>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
          {meta.range}
        </span>
        {meta.chapterCount != null && (
          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-700">
            {meta.chapterCount} chapters
          </span>
        )}
      </div>

      {meta.desc && (
        <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-4">
          {meta.desc}
        </p>
      )}

      {topChars.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Main characters
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topChars.map(({ c, count }) => (
              <Link
                key={c.id}
                to={`/characters/${c.id}`}
                title={
                  count > 0
                    ? `${c.name} — ${count} appearances here`
                    : (c.name ?? '')
                }
                className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-xs text-gray-700"
              >
                <span className="truncate max-w-[120px]">{c.name}</span>
                {count > 0 && <span className="text-gray-400">{count}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={onOpenDetails}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          More details
        </button>
        <Link
          to={meta.detailPath}
          className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Full page →
        </Link>
      </div>
    </div>
  )
}
