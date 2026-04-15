/**
 * Exporters for the character-appearance race chart.
 *
 *   - GIF: rasterise each sampled chapter onto a <canvas>, encode via gifenc.
 *   - SVG: build a self-looping SMIL animation — one group per character
 *          that ever reaches the top-N band, with its translateY (rank),
 *          bar width, and opacity animated through the sampled timeline.
 *
 * Both renderers share `drawRaceFrameCanvas` for consistent layout between
 * preview (static PNG, if ever wanted) and GIF export. The SVG renderer is
 * layout-equivalent but expressed as vector SMIL primitives.
 */
import type { RaceFrame } from './appearanceRace'
import { wordColor } from './wordCloud'
import { isLightColor, STRAW_HAT_MARKER } from '../constants/strawHatColors'

export interface RaceExportOpts {
  width: number
  height: number
  /** Target sampled-frame count across the whole timeline. */
  frames?: number
  /** Loop duration in seconds (GIF: also informs per-frame delay). */
  duration?: number
  background?: string
  /** Top-N rows visible per frame. */
  topN?: number
  /** Denominator for absolute bar-width normalisation. Use `result.maxScore`
   *  from computeRaceFrames so 'count' and 'decay' modes both pin at 100%. */
  maxScore: number
  title?: string
  /** Arc label per chapter, used for the sub-header text. Optional. */
  arcByChapter?: Map<number, string>
  /** Font family for rendered text (SVG/Canvas). Defaults to 'sans-serif'. */
  fontFamily?: string
  /** Scale factor for text sizes. Useful for CLI exports at higher resolutions
   *  where the default 14px header/label size looks tiny. Defaults to 1. */
  fontScale?: number
}

const BG_DEFAULT = '#fafafa'
const ROW_HEIGHT = 42
const ROW_GAP = 4
const PADDING_X = 20
const RANK_LABEL_W = 32
const SCORE_LABEL_W = 72
const BAR_INSET = 8

/**
 * Header geometry, scaled by fontScale. Chapter number sits on its own line
 * with the saga–arc subtitle stacked below (matching the in-app component).
 * Stacking avoids the overlap we got when the arc label was placed to the
 * right of the chapter text and bigger fontScales pushed them into each other.
 */
function computeHeaderLayout(
  fontScale: number,
  hasTitle: boolean
): {
  titleBaseY: number
  chapterBaseY: number
  subBaseY: number
  barsTop: number
} {
  const titleBaseY = hasTitle ? 22 * fontScale : 0
  const chapterBaseY = 58 * fontScale
  const subBaseY = chapterBaseY + 20 * fontScale
  const barsTop = Math.round(subBaseY + 12 * fontScale)
  return { titleBaseY, chapterBaseY, subBaseY, barsTop }
}

/**
 * Pick N indices spread across `[0, totalLen)`. Used to downsample a long
 * timeline (1000+ chapters) to a GIF-friendly frame count.
 */
export function sampleFrameIndices(totalLen: number, target: number): number[] {
  if (totalLen <= 0) return []
  if (target >= totalLen) {
    return Array.from({ length: totalLen }, (_, i) => i)
  }
  const out: number[] = []
  for (let i = 0; i < target; i++) {
    out.push(Math.min(totalLen - 1, Math.floor((i * totalLen) / target)))
  }
  return out
}

/** Format a (possibly fractional) score as it appears in the UI. */
function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/** Canvas-compatible 2D context — works with browser Canvas and @napi-rs/canvas. */
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

/**
 * Draw a single chapter frame (header + top-N rows + progress bar) onto any
 * Canvas-2D-compatible context. `fontFamily` defaults to a generic sans so
 * the CLI can substitute a bundled font if needed.
 */
export function drawRaceFrameCanvas(
  ctx: Ctx2D,
  frame: RaceFrame,
  opts: RaceExportOpts & {
    progress: number
  }
): void {
  const {
    width,
    height,
    background = BG_DEFAULT,
    topN = 10,
    maxScore,
    title,
    arcByChapter,
    progress,
    fontFamily = 'sans-serif',
    fontScale = 1,
  } = opts
  // Scale all label sizes together; caller passes fontScale when rendering at
  // higher-than-default resolutions (e.g. CLI 1080p+).
  const sz = (n: number) => (n * fontScale).toFixed(1)

  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  const layout = computeHeaderLayout(fontScale, !!title)

  // Header — chapter number + saga/arc subtitle stacked below (+ optional
  // global title at top).
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (title) {
    ctx.font = `500 ${sz(14)}px ${fontFamily}`
    ctx.fillStyle = '#6b7280'
    ctx.fillText(title, PADDING_X, layout.titleBaseY)
  }
  ctx.fillStyle = '#111827'
  ctx.font = `700 ${sz(32)}px ${fontFamily}`
  ctx.fillText(`Chapter ${frame.chapter}`, PADDING_X, layout.chapterBaseY)

  const arcTitle = arcByChapter?.get(frame.chapter)
  if (arcTitle) {
    ctx.font = `500 ${sz(14)}px ${fontFamily}`
    ctx.fillStyle = '#6b7280'
    ctx.fillText(arcTitle, PADDING_X, layout.subBaseY)
  }

  // Bar area — rows stacked vertically.
  const barsTop = layout.barsTop
  const rowsHeight = topN * ROW_HEIGHT
  const barsLeft = PADDING_X + RANK_LABEL_W
  const barsRight = width - PADDING_X - SCORE_LABEL_W
  const barAreaWidth = Math.max(20, barsRight - barsLeft)

  for (let i = 0; i < topN; i++) {
    const entry = frame.entries[i]
    const y = barsTop + i * ROW_HEIGHT
    // Rank label (always drawn, even for empty rows, as a consistent ruler).
    ctx.textAlign = 'right'
    ctx.font = `600 ${sz(14)}px ${fontFamily}`
    ctx.fillStyle = '#9ca3af'
    ctx.fillText(
      String(i + 1),
      PADDING_X + RANK_LABEL_W - 8,
      y + ROW_HEIGHT / 2 + 4
    )
    ctx.textAlign = 'left'
    if (!entry) continue

    const pct = maxScore > 0 ? Math.max(2, (entry.score / maxScore) * 100) : 0
    const barWidth = (pct / 100) * barAreaWidth
    const barHeight = ROW_HEIGHT - ROW_GAP * 2
    const barY = y + ROW_GAP
    const color = wordColor(entry.id, entry.isSHP)

    // Bar.
    roundRect(ctx, barsLeft, barY, barWidth, barHeight, 6)
    ctx.fillStyle = color
    ctx.fill()

    // Name — inside bar if it fits, otherwise just right of the bar edge.
    const nameLabel = entry.isSHP
      ? `${STRAW_HAT_MARKER} ${entry.name}`
      : entry.name
    ctx.font = `700 ${sz(14)}px ${fontFamily}`
    const nameWidth = ctx.measureText(nameLabel).width
    const insideFits = barWidth - BAR_INSET * 2 >= nameWidth
    if (insideFits) {
      ctx.fillStyle = isLightColor(color) ? '#111827' : '#ffffff'
      ctx.fillText(nameLabel, barsLeft + BAR_INSET, barY + barHeight / 2 + 5)
    } else {
      ctx.fillStyle = '#111827'
      ctx.fillText(
        nameLabel,
        barsLeft + barWidth + BAR_INSET,
        barY + barHeight / 2 + 5
      )
    }

    // Score — right-aligned in dedicated gutter.
    ctx.textAlign = 'right'
    ctx.fillStyle = '#111827'
    ctx.font = `700 ${sz(14)}px ${fontFamily}`
    ctx.fillText(
      formatScore(entry.score),
      width - PADDING_X,
      barY + barHeight / 2 + 5
    )
    ctx.textAlign = 'left'
  }

  // Progress bar at the bottom of the canvas.
  const progressY = barsTop + rowsHeight + 16
  const progressH = 6
  ctx.fillStyle = '#e5e7eb'
  roundRect(ctx, PADDING_X, progressY, width - PADDING_X * 2, progressH, 3)
  ctx.fill()
  ctx.fillStyle = '#3b82f6'
  roundRect(
    ctx,
    PADDING_X,
    progressY,
    Math.max(2, (width - PADDING_X * 2) * Math.max(0, Math.min(1, progress))),
    progressH,
    3
  )
  ctx.fill()
}

/** Rounded-rect helper compatible with both browser and node canvas. */
function roundRect(
  ctx: Ctx2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/**
 * Encode a race timeline as an animated GIF. Samples `frames` chapters
 * evenly across the timeline, draws each on an OffscreenCanvas (falling
 * back to a DOM canvas), and encodes via gifenc with per-frame palette
 * quantisation.
 */
export async function exportRaceAsGif(
  frames: RaceFrame[],
  opts: RaceExportOpts
): Promise<Blob> {
  const {
    width,
    height,
    frames: frameCount = 120,
    duration = 8,
    background = BG_DEFAULT,
  } = opts
  if (frames.length === 0) throw new Error('no race frames to export')

  // gifenc ships as CJS with named exports that Node's ESM loader can't
  // extract cleanly. Vite bundles this fine for the browser; for Node-side
  // imports we expose a separate CLI path. Dynamic import here keeps the
  // dependency out of the module's static graph so consumers that only want
  // `drawRaceFrameCanvas` / `exportRaceAsSvg` don't drag gifenc in.
  const { GIFEncoder, applyPalette, quantize } = await import('gifenc')
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvas 2d context unavailable')

  const gif = GIFEncoder()
  const indices = sampleFrameIndices(frames.length, frameCount)
  const delayMs = Math.max(20, Math.round((duration * 1000) / indices.length))

  for (let i = 0; i < indices.length; i++) {
    const frame = frames[indices[i]]
    drawRaceFrameCanvas(ctx, frame, {
      ...opts,
      background,
      progress: indices.length === 1 ? 1 : i / (indices.length - 1),
    })
    const { data } = ctx.getImageData(0, 0, width, height)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, width, height, { palette, delay: delayMs })
    if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0))
  }
  gif.finish()
  return new Blob([gif.bytes() as BlobPart], { type: 'image/gif' })
}

/**
 * Build a self-looping SMIL-animated SVG of the race. Renders one group per
 * character that ever appears in the top-N during the sampled timeline; each
 * group animates its (translateY, width, opacity) so the bar enters/leaves
 * the top band and changes rank smoothly.
 *
 * Layout mirrors `drawRaceFrameCanvas` so the two exports look consistent.
 */
export function exportRaceAsSvg(
  frames: RaceFrame[],
  opts: RaceExportOpts
): string {
  const {
    width,
    height,
    frames: frameCount = 120,
    duration = 8,
    background = BG_DEFAULT,
    topN = 10,
    maxScore,
    title,
    arcByChapter,
    fontFamily = 'sans-serif',
    fontScale = 1,
  } = opts
  const fontSz = (n: number) => (n * fontScale).toFixed(1)
  if (frames.length === 0) throw new Error('no race frames to export')

  const indices = sampleFrameIndices(frames.length, frameCount)
  const N = indices.length
  const keyTimes: string[] = []
  for (let i = 0; i < N; i++) keyTimes.push((i / Math.max(1, N - 1)).toFixed(4))
  const keyTimesStr = keyTimes.join(';')

  const layout = computeHeaderLayout(fontScale, !!title)
  const barsTop = layout.barsTop
  const barsLeft = PADDING_X + RANK_LABEL_W
  const barsRight = width - PADDING_X - SCORE_LABEL_W
  const barAreaWidth = Math.max(20, barsRight - barsLeft)
  const barHeight = ROW_HEIGHT - ROW_GAP * 2
  const offscreenY = barsTop + topN * ROW_HEIGHT + 100 // park invisible rows here

  const esc = (s: string) =>
    s.replace(/[<>&"']/g, (c) =>
      c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '&'
            ? '&amp;'
            : c === '"'
              ? '&quot;'
              : '&#39;'
    )

  // Collect, per character, per-sample (rank, score, pct). If a character is
  // not in the top-N at sample i, their state is "hidden" (opacity 0, parked).
  interface CharState {
    id: string
    name: string
    isSHP: boolean
    color: string
    ranks: number[] // 1..topN or 0 if absent
    widths: number[] // bar width in px
    opacities: number[] // 0 or 1
    scores: number[] // for label animation (if we ever want it)
    everVisible: boolean
  }
  const byId = new Map<string, CharState>()
  for (let s = 0; s < N; s++) {
    const frame = frames[indices[s]]
    for (let i = 0; i < Math.min(topN, frame.entries.length); i++) {
      const e = frame.entries[i]
      let st = byId.get(e.id)
      if (!st) {
        st = {
          id: e.id,
          name: e.name,
          isSHP: e.isSHP,
          color: wordColor(e.id, e.isSHP),
          ranks: new Array(N).fill(0),
          widths: new Array(N).fill(0),
          opacities: new Array(N).fill(0),
          scores: new Array(N).fill(0),
          everVisible: true,
        }
        byId.set(e.id, st)
      }
      st.ranks[s] = i + 1
      const pct = maxScore > 0 ? Math.max(2, (e.score / maxScore) * 100) : 0
      st.widths[s] = (pct / 100) * barAreaWidth
      st.opacities[s] = 1
      st.scores[s] = e.score
    }
  }

  // Fill in "hidden" translate y-values so the SMIL animation carries the
  // last known rank forward during gaps (less jarring than snapping to the
  // parking row).
  for (const st of byId.values()) {
    let lastRank = topN // default parking rank if never-visible-before
    for (let s = 0; s < N; s++) {
      if (st.ranks[s] > 0) {
        lastRank = st.ranks[s]
      } else {
        st.ranks[s] = lastRank
      }
    }
  }

  // Emit one <g> per character. Using a group with <animateTransform> for
  // translation and a child <rect>/<text> with <animate> for width/opacity
  // keeps the per-character SMIL bundled together.
  const groups: string[] = []
  for (const st of byId.values()) {
    const translates = st.ranks
      .map((r, s) => {
        const y =
          st.opacities[s] === 0
            ? offscreenY
            : barsTop + (r - 1) * ROW_HEIGHT + ROW_GAP
        return `${barsLeft.toFixed(2)},${y.toFixed(2)}`
      })
      .join(';')
    const widths = st.widths.map((w) => w.toFixed(2)).join(';')
    const opacities = st.opacities.map((o) => o.toFixed(0)).join(';')
    const nameLabel = st.isSHP ? `${STRAW_HAT_MARKER} ${st.name}` : st.name
    const textFill = isLightColor(st.color) ? '#111827' : '#ffffff'

    groups.push(
      `<g opacity="0">` +
        `<animateTransform attributeName="transform" type="translate" ` +
        `dur="${duration}s" repeatCount="indefinite" ` +
        `values="${translates}" keyTimes="${keyTimesStr}"/>` +
        `<animate attributeName="opacity" dur="${duration}s" ` +
        `repeatCount="indefinite" values="${opacities}" keyTimes="${keyTimesStr}"/>` +
        `<rect x="0" y="0" width="0" height="${barHeight}" rx="6" ry="6" fill="${st.color}">` +
        `<animate attributeName="width" dur="${duration}s" ` +
        `repeatCount="indefinite" values="${widths}" keyTimes="${keyTimesStr}"/>` +
        `</rect>` +
        `<text x="${BAR_INSET}" y="${barHeight / 2 + 5}" ` +
        `font-family="${esc(fontFamily)}" font-weight="700" font-size="${fontSz(14)}" ` +
        `fill="${textFill}">${esc(nameLabel)}</text>` +
        `</g>`
    )
  }

  // Rank rail (1..topN labels, static).
  const rankLabels: string[] = []
  for (let i = 0; i < topN; i++) {
    rankLabels.push(
      `<text x="${PADDING_X + RANK_LABEL_W - 8}" y="${
        barsTop + i * ROW_HEIGHT + ROW_HEIGHT / 2 + 4
      }" text-anchor="end" font-family="${esc(fontFamily)}" font-size="${fontSz(14)}" ` +
        `font-weight="600" fill="#9ca3af">${i + 1}</text>`
    )
  }

  // Animated chapter counter: each sampled label is a separate <text> whose
  // opacity is driven to "1" only during its time window.
  const chapterLabels: string[] = []
  const windowFrac = 1 / Math.max(1, N)
  for (let s = 0; s < N; s++) {
    const chapter = frames[indices[s]].chapter
    const begin = (s * duration) / N
    const dur = windowFrac * duration
    chapterLabels.push(
      `<text x="${PADDING_X}" y="${layout.chapterBaseY.toFixed(1)}" font-family="${esc(fontFamily)}" ` +
        `font-weight="700" font-size="${fontSz(32)}" fill="#111827" opacity="0">` +
        `<set attributeName="opacity" to="1" begin="${begin.toFixed(3)}s" ` +
        `dur="${dur.toFixed(3)}s" repeatCount="indefinite"/>` +
        `Chapter ${chapter}</text>`
    )
    const arc = arcByChapter?.get(chapter)
    if (arc) {
      // Stack below the chapter number so larger font sizes (high fontScale)
      // don't overlap the subtitle.
      chapterLabels.push(
        `<text x="${PADDING_X}" y="${layout.subBaseY.toFixed(1)}" font-family="${esc(fontFamily)}" ` +
          `font-weight="500" font-size="${fontSz(14)}" fill="#6b7280" opacity="0">` +
          `<set attributeName="opacity" to="1" begin="${begin.toFixed(3)}s" ` +
          `dur="${dur.toFixed(3)}s" repeatCount="indefinite"/>` +
          `${esc(arc)}</text>`
      )
    }
  }

  // Animated progress bar (width interpolates 0..fullWidth over the loop).
  const progressFullW = width - PADDING_X * 2
  const progressY = barsTop + topN * ROW_HEIGHT + 16
  const progressRail =
    `<rect x="${PADDING_X}" y="${progressY}" width="${progressFullW}" ` +
    `height="6" rx="3" ry="3" fill="#e5e7eb"/>` +
    `<rect x="${PADDING_X}" y="${progressY}" width="0" height="6" rx="3" ry="3" fill="#3b82f6">` +
    `<animate attributeName="width" dur="${duration}s" repeatCount="indefinite" ` +
    `values="0;${progressFullW}" keyTimes="0;1"/>` +
    `</rect>`

  const titleNode = title
    ? `<text x="${PADDING_X}" y="${layout.titleBaseY.toFixed(1)}" font-family="${esc(fontFamily)}" ` +
      `font-size="${fontSz(14)}" font-weight="500" fill="#6b7280">${esc(title)}</text>`
    : ''

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="${background}"/>` +
    titleNode +
    chapterLabels.join('') +
    rankLabels.join('') +
    groups.join('') +
    progressRail +
    `</svg>\n`
  )
}
