import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import cloud from 'd3-cloud'
import { fetchInsightsRawData } from '../../services/analyticsService'
import { STRAW_HAT_IDS } from '../../constants/characters'
import { isLightColor } from '../../constants/strawHatColors'
import { Character } from '../../types/character'
import { ChartCard } from '../common/ChartCard'
import { formatBounty } from '../insights/constants'
import {
  MIN_FONT,
  buildSpherePlacements,
  hashId,
  wordCloudFontSize,
  wordColor,
  type SpherePlacement,
  type WordCloudItem,
} from '../../utils/wordCloud'

export type WordCloudMetric = 'chapter' | 'cover' | 'arc' | 'saga' | 'bounty'

export interface WordCloudMetricOption {
  value: WordCloudMetric
  label: string
  defaultMin: number
  suffix: string
  /** Input step — useful when values span large magnitudes (e.g. bounty). */
  step?: number
  /** Display formatter for values in tooltips / labels. Defaults to String. */
  formatValue?: (n: number) => string
}

export const WORD_CLOUD_METRIC_OPTIONS: WordCloudMetricOption[] = [
  { value: 'chapter', label: 'Chapter Count', defaultMin: 50, suffix: 'ch' },
  { value: 'cover', label: 'Volume Cover Count', defaultMin: 1, suffix: 'cv' },
  { value: 'arc', label: 'Arc Count', defaultMin: 1, suffix: 'arcs' },
  { value: 'saga', label: 'Saga Count', defaultMin: 1, suffix: 'sagas' },
  {
    value: 'bounty',
    label: 'Bounty',
    defaultMin: 100_000_000,
    suffix: '\u0e3f',
    step: 10_000_000,
    formatValue: formatBounty,
  },
]

export function getWordCloudMetricValue(
  c: Character,
  metric: WordCloudMetric
): number {
  switch (metric) {
    case 'chapter':
      return c.appearance_count ?? c.chapter_list?.length ?? 0
    case 'cover':
      return c.cover_appearance_count ?? c.cover_volume_list?.length ?? 0
    case 'arc':
      return c.arc_list?.length ?? 0
    case 'saga':
      return c.saga_list?.length ?? 0
    case 'bounty':
      return c.bounty ?? 0
  }
}

export type WordCloudMode = 'flat' | 'sphere'

interface WordCloudProps {
  items: WordCloudItem[]
  minValue: number
  maxValue: number
  suffix: string
  linkCharacters?: boolean
  /** Cloud canvas height in px. */
  height?: number
  /** 'flat' = static d3-cloud packing; 'sphere' = rotating 3D sphere. */
  mode?: WordCloudMode
  /** Format function for values shown in tooltips (e.g. bounty → "1.5B"). */
  formatValue?: (n: number) => string
}

interface CloudWord extends cloud.Word {
  id: string
  name: string
  value: number
  isSHP: boolean
}

interface LaidOutWord extends CloudWord {
  x: number
  y: number
  size: number
  rotate: number
}

/**
 * Dispatcher: picks between the flat d3-cloud layout and the rotating sphere.
 * The two modes are separate components so switching mode fully unmounts the
 * other one (cancelling its RAF loop or d3-cloud job).
 */
export function CharacterWordCloud({
  mode = 'sphere',
  ...props
}: WordCloudProps) {
  if (props.items.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-sm">
        No characters match the current filter.
      </p>
    )
  }
  return mode === 'sphere' ? (
    <CharacterWordCloudSphere {...props} />
  ) : (
    <CharacterWordCloudFlat {...props} />
  )
}

/** Static 2D word packing via d3-cloud. */
function CharacterWordCloudFlat({
  items,
  minValue,
  maxValue,
  suffix,
  linkCharacters = true,
  height = 420,
  formatValue = String,
}: Omit<WordCloudProps, 'mode'>) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [laidOut, setLaidOut] = useState<LaidOutWord[]>([])

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    setWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width)
        if (w > 0) setWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    // Parent short-circuits on items.length === 0, and laidOut starts empty,
    // so no explicit reset is needed here — just bail until we have a width.
    if (items.length === 0 || width <= 0) return
    const words: CloudWord[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      value: item.value,
      isSHP: item.isSHP,
      text: item.name,
      size: wordCloudFontSize(item.value, minValue, maxValue),
      rotate: hashId(item.id) < 0.25 ? 90 : 0,
    }))
    const layout = cloud<CloudWord>()
      .size([width, height])
      .words(words)
      .padding(2)
      .rotate((d) => d.rotate ?? 0)
      .font('sans-serif')
      .fontSize((d) => d.size ?? MIN_FONT)
      .spiral('archimedean')
      .random(() => 0.5)
      .on('end', (laid) => {
        setLaidOut(laid as LaidOutWord[])
      })
    layout.start()
    return () => {
      layout.stop()
    }
  }, [items, width, height, minValue, maxValue])

  // Derived: we're still computing if there's work to do and nothing placed
  // yet. Avoids a setState-in-effect call that React 19 now lints against.
  const computing = items.length > 0 && width > 0 && laidOut.length === 0
  const hidden = items.length - laidOut.length

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg border border-gray-100 bg-gray-50/30 overflow-hidden"
      style={{ height }}
    >
      {computing && laidOut.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
          Laying out cloud…
        </div>
      )}
      {width > 0 && (
        <svg
          width={width}
          height={height}
          aria-label="Character word cloud"
          role="img"
        >
          <g transform={`translate(${width / 2},${height / 2})`}>
            {laidOut.map((w) => {
              const fill = wordColor(w.id, w.isSHP)
              // Light Straw Hat colours (Usopp's yellow, Franky/Vivi/Brook
              // greys) would vanish on the white backdrop — add a thin dark
              // stroke painted behind the fill for contrast.
              const needsOutline = isLightColor(fill)
              return (
                <text
                  key={w.id}
                  textAnchor="middle"
                  transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
                  fontFamily="sans-serif"
                  fontWeight={w.isSHP ? 700 : 500}
                  fontSize={w.size}
                  fill={fill}
                  stroke={needsOutline ? '#374151' : undefined}
                  strokeWidth={needsOutline ? 1 : undefined}
                  paintOrder={needsOutline ? 'stroke fill' : undefined}
                  style={{
                    cursor: linkCharacters ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={
                    linkCharacters
                      ? () => navigate(`/characters/${w.id}`)
                      : undefined
                  }
                >
                  <title>{`${w.name} — ${formatValue(w.value)} ${suffix}`}</title>
                  {w.name}
                </text>
              )
            })}
          </g>
        </svg>
      )}
      {hidden > 0 && !computing && (
        <div className="absolute bottom-1 right-2 text-[10px] text-gray-400 bg-white/70 px-1.5 py-0.5 rounded">
          {hidden} word{hidden === 1 ? '' : 's'} hidden (no fit)
        </div>
      )}
    </div>
  )
}

/**
 * 3D-style rotating word sphere rendered as SVG. Positions are laid out with a
 * Fibonacci spiral on the unit sphere, then projected each frame inside a
 * requestAnimationFrame loop that mutates the live DOM directly (no React
 * re-render per frame). Mouse position steers the rotation; click-and-drag
 * takes manual control; left alone the sphere drifts gently.
 */
function CharacterWordCloudSphere({
  items,
  minValue,
  maxValue,
  suffix,
  linkCharacters = true,
  height = 420,
  formatValue = String,
}: Omit<WordCloudProps, 'mode'>) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<SVGGElement>(null)
  const [width, setWidth] = useState(0)

  // Mutable animation state (never triggers re-render).
  const rotRef = useRef({ x: 0, y: 0 })
  const velRef = useRef({ x: 0, y: 0 })
  const mouseRef = useRef({
    over: false,
    x: 0,
    y: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    downX: 0,
    downY: 0,
  })
  const didDragRef = useRef(false)

  // Track container width so the layout fills available space.
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    setWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width)
        if (w > 0) setWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Deterministic Fibonacci-sphere placement, stable across renders for the
  // same items+min+max. Sort by hashId first so new items don't reshuffle the
  // whole cloud visually.
  const placements = useMemo<SpherePlacement[]>(
    () => buildSpherePlacements(items, minValue, maxValue),
    [items, minValue, maxValue]
  )

  // Animation loop — rotates the sphere, projects to 2D, mutates SVG directly.
  useEffect(() => {
    if (placements.length === 0 || width <= 0) return
    const group = groupRef.current
    if (!group) return

    // Build an id → element lookup once per placements change.
    const textById = new Map<string, SVGTextElement>()
    group.querySelectorAll<SVGTextElement>('text[data-id]').forEach((t) => {
      const id = t.getAttribute('data-id')
      if (id) textById.set(id, t)
    })

    const radius = Math.min(width, height) * 0.42
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let rafId = 0
    const tick = () => {
      const rot = rotRef.current
      const vel = velRef.current
      const mouse = mouseRef.current

      if (!mouse.dragging) {
        if (mouse.over) {
          // Distance of pointer from centre steers rotation velocity.
          const cx = width / 2
          const cy = height / 2
          const dx = (mouse.x - cx) / cx
          const dy = (mouse.y - cy) / cy
          const maxSpeed = reducedMotion ? 0 : 0.025
          vel.y = dx * maxSpeed
          vel.x = -dy * maxSpeed
        } else {
          // Idle: damp user velocity and keep a gentle baseline spin.
          vel.x *= 0.9
          vel.y *= 0.9
          if (!reducedMotion) {
            const baseline = 0.003
            if (Math.abs(vel.y) < baseline) vel.y = baseline
          }
        }
      }

      rot.x += vel.x
      rot.y += vel.y

      const sinX = Math.sin(rot.x)
      const cosX = Math.cos(rot.x)
      const sinY = Math.sin(rot.y)
      const cosY = Math.cos(rot.y)

      // Project each placement and z-sort back-to-front so front words paint
      // over back ones (SVG uses document order; later siblings are on top).
      const projected = new Array<{
        el: SVGTextElement
        x: number
        y: number
        z: number
        scale: number
        opacity: number
      }>(placements.length)
      for (let i = 0; i < placements.length; i++) {
        const p = placements[i]
        // Rotate around Y axis.
        const rx = p.bx * cosY + p.bz * sinY
        const rz0 = -p.bx * sinY + p.bz * cosY
        // Rotate around X axis.
        const ry = p.by * cosX - rz0 * sinX
        const rz = p.by * sinX + rz0 * cosX
        const depth = (rz + 1) / 2 // 0 (far) .. 1 (near)
        const el = textById.get(p.id)
        if (!el) continue
        projected[i] = {
          el,
          x: rx * radius,
          y: ry * radius,
          z: rz,
          scale: 0.35 + 0.75 * depth,
          opacity: 0.2 + 0.8 * depth,
        }
      }
      projected.sort((a, b) => a.z - b.z)

      // Apply transforms and reorder children by z-depth in one pass.
      const frag = document.createDocumentFragment()
      for (const q of projected) {
        if (!q) continue
        q.el.setAttribute(
          'transform',
          `translate(${q.x.toFixed(2)},${q.y.toFixed(2)}) scale(${q.scale.toFixed(3)})`
        )
        q.el.setAttribute('opacity', q.opacity.toFixed(3))
        frag.appendChild(q.el)
      }
      group.appendChild(frag)

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [placements, width, height])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouse = mouseRef.current
    mouse.x = e.clientX - rect.left
    mouse.y = e.clientY - rect.top
    mouse.over = true
    if (mouse.dragging) {
      const dx = e.clientX - mouse.lastX
      const dy = e.clientY - mouse.lastY
      mouse.lastX = e.clientX
      mouse.lastY = e.clientY
      const distFromDown = Math.hypot(
        e.clientX - mouse.downX,
        e.clientY - mouse.downY
      )
      if (distFromDown > 4) didDragRef.current = true
      rotRef.current.y += dx * 0.006
      rotRef.current.x += -dy * 0.006
      // Carry a small residual velocity for inertia on release.
      velRef.current.y = dx * 0.006
      velRef.current.x = -dy * 0.006
    }
  }
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const mouse = mouseRef.current
    mouse.dragging = true
    mouse.lastX = e.clientX
    mouse.lastY = e.clientY
    mouse.downX = e.clientX
    mouse.downY = e.clientY
    didDragRef.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    mouseRef.current.dragging = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }
  const handlePointerLeave = () => {
    mouseRef.current.over = false
    mouseRef.current.dragging = false
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg border border-gray-100 bg-gray-50/30 overflow-hidden select-none"
      style={{
        height,
        cursor: linkCharacters ? 'grab' : 'default',
        touchAction: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          aria-label="Interactive character word cloud — drag or hover to rotate"
          role="img"
        >
          <g ref={groupRef} transform={`translate(${width / 2},${height / 2})`}>
            {placements.map((p) => {
              const needsOutline = isLightColor(p.color)
              return (
                <text
                  key={p.id}
                  data-id={p.id}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="sans-serif"
                  fontWeight={p.isSHP ? 700 : 500}
                  fontSize={p.size}
                  fill={p.color}
                  stroke={needsOutline ? '#374151' : undefined}
                  strokeWidth={needsOutline ? 1 : undefined}
                  paintOrder={needsOutline ? 'stroke fill' : undefined}
                  style={{
                    cursor: linkCharacters ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={
                    linkCharacters
                      ? () => {
                          if (didDragRef.current) return
                          navigate(`/characters/${p.id}`)
                        }
                      : undefined
                  }
                >
                  <title>{`${p.name} — ${formatValue(p.value)} ${suffix}`}</title>
                  {p.name}
                </text>
              )
            })}
          </g>
        </svg>
      )}
    </div>
  )
}

type SHPFilter = 'all' | 'hide' | 'only'

export function CharacterWordCloudSection() {
  const [metric, setMetric] = useState<WordCloudMetric>('chapter')
  const [shpFilter, setSHPFilter] = useState<SHPFilter>('all')
  const [mode, setMode] = useState<WordCloudMode>('sphere')
  const [minInput, setMinInput] = useState<Record<WordCloudMetric, number>>({
    chapter: 50,
    cover: 1,
    arc: 1,
    saga: 1,
    bounty: 100_000_000,
  })

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const metricOpt = WORD_CLOUD_METRIC_OPTIONS.find((o) => o.value === metric)!
  const minValue = minInput[metric]

  const { items, maxValue, totalWithAny } = useMemo(() => {
    if (!raw)
      return {
        items: [] as WordCloudItem[],
        maxValue: 0,
        totalWithAny: 0,
      }
    const scored = raw.characters
      .filter((c) => c.name)
      .map<WordCloudItem>((c) => ({
        id: c.id,
        name: c.name as string,
        value: getWordCloudMetricValue(c, metric),
        isSHP: STRAW_HAT_IDS.has(c.id),
      }))
      .filter((r) =>
        shpFilter === 'hide' ? !r.isSHP : shpFilter === 'only' ? r.isSHP : true
      )
    const withAny = scored.filter((r) => r.value > 0)
    const max = withAny.reduce((m, r) => (r.value > m ? r.value : m), 0)
    const filtered = scored
      .filter((r) => r.value >= minValue)
      .sort((a, b) => hashId(a.id) - hashId(b.id))
    return { items: filtered, maxValue: max, totalWithAny: withAny.length }
  }, [raw, metric, minValue, shpFilter])

  const handleMetricChange = (m: WordCloudMetric) => {
    setMetric(m)
  }

  const handleMinChange = (n: number) => {
    const clamped = Math.max(1, Math.min(n, Math.max(1, maxValue)))
    setMinInput((prev) => ({ ...prev, [metric]: clamped }))
  }

  // Animated-export state. null = idle, 'gif' | 'svg' = encoding.
  const [exporting, setExporting] = useState<null | 'gif' | 'svg'>(null)

  const handleDownload = async (format: 'gif' | 'svg') => {
    if (exporting) return
    setExporting(format)
    try {
      const { buildSpherePlacements: build } = await import(
        '../../utils/wordCloud'
      )
      const { exportSphereAsGif, exportSphereAsSvg, downloadBlob } =
        await import('../../utils/wordCloudExport')
      const placementsForExport = build(items, minValue, maxValue)
      const opts = { width: 900, height: 600 }
      const metricOptCurrent = WORD_CLOUD_METRIC_OPTIONS.find(
        (o) => o.value === metric
      )!
      const baseName = `character-word-cloud-${metricOptCurrent.value}`
      if (format === 'gif') {
        const blob = await exportSphereAsGif(placementsForExport, opts)
        downloadBlob(blob, `${baseName}.gif`)
      } else {
        const svg = exportSphereAsSvg(placementsForExport, opts)
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        downloadBlob(blob, `${baseName}.svg`)
      }
    } catch (err) {
      console.error('Word cloud export failed:', err)
      alert(err instanceof Error ? err.message : 'Export failed. See console.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="mb-6">
      <ChartCard
        title="Character Word Cloud"
        description="Character names sized by chapter, volume cover, arc, saga counts, or bounty. Toggle between a flat packing (2D) and a rotating sphere (3D) — in 3D, move the mouse to steer or drag to rotate. Click a name to open the character."
        downloadFileName="character-word-cloud"
        chartId="character-word-cloud"
        embedPath="/embed/insights/character-word-cloud"
        loading={isLoading}
        filters={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Size by</span>
              <select
                value={metric}
                onChange={(e) =>
                  handleMetricChange(e.target.value as WordCloudMetric)
                }
                className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WORD_CLOUD_METRIC_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-600">Min</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, maxValue)}
                step={metricOpt.step ?? 1}
                value={minValue}
                onChange={(e) =>
                  handleMinChange(parseInt(e.target.value, 10) || 1)
                }
                className="w-28 px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
              />
            </label>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {(['all', 'hide', 'only'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSHPFilter(v)}
                  className={`px-3 py-1.5 transition-colors ${
                    shpFilter === v
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v === 'all' ? 'All' : v === 'hide' ? 'Hide SHP' : 'Only SHP'}
                </button>
              ))}
            </div>
            <div
              className="inline-flex rounded-lg border border-gray-200 overflow-hidden"
              role="group"
              aria-label="Word cloud view mode"
            >
              {(['flat', 'sphere'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setMode(v)}
                  className={`px-3 py-1.5 transition-colors ${
                    mode === v
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v === 'flat' ? '2D' : '3D'}
                </button>
              ))}
            </div>
            {mode === 'sphere' && (
              <div
                className="inline-flex items-center gap-1"
                role="group"
                aria-label="Download animated word cloud"
              >
                <span className="text-gray-500 text-xs mr-1">Animated:</span>
                {(['gif', 'svg'] as const).map((fmt) => {
                  const busy = exporting === fmt
                  const disabled = exporting !== null
                  return (
                    <button
                      key={fmt}
                      onClick={() => handleDownload(fmt)}
                      disabled={disabled}
                      title={`Download rotating sphere as ${fmt.toUpperCase()}`}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors tabular-nums ${
                        busy
                          ? 'bg-blue-600 text-white border-blue-600'
                          : disabled
                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {busy ? 'Encoding…' : fmt.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            )}
            <span className="text-gray-500 text-xs">
              Max:{' '}
              <span className="tabular-nums">
                {metricOpt.formatValue?.(maxValue) ?? maxValue}
              </span>
            </span>
            <span className="text-gray-500 text-xs">
              Showing{' '}
              <span className="tabular-nums font-medium text-gray-700">
                {items.length}
              </span>{' '}
              of <span className="tabular-nums">{totalWithAny}</span> characters
            </span>
          </div>
        }
      >
        <CharacterWordCloud
          items={items}
          minValue={minValue}
          maxValue={maxValue}
          suffix={metricOpt.suffix}
          formatValue={metricOpt.formatValue}
          mode={mode}
        />
      </ChartCard>
    </div>
  )
}
