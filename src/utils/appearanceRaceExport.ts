/**
 * Exporters for the character-appearance race chart.
 *
 *   - GIF: rasterise each sampled chapter onto a <canvas>, encode via gifenc.
 *   - SVG: render a single static frame as layered vector primitives. GIF is
 *          the animated format; SVG is the importable snapshot — design tools
 *          (Figma, Illustrator) don't play SMIL, so an animated SVG there
 *          stacks every frame on top of itself. A static snapshot gives users
 *          a clean vector of whatever chapter they're viewing.
 *
 * Both renderers share `drawRaceFrameCanvas` for layout so canvas-rasterised
 * frames (GIF, CLI PNG sequence) and the SVG snapshot match pixel-for-pixel.
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
 * Options for a single-frame SVG export. `progress` (0..1) drives only the
 * bottom progress bar fill — pass the caller's current playback position so
 * the snapshot matches what's on screen. `duration` is unused here (GIF-only)
 * and accepted via the shared `RaceExportOpts` shape for ergonomics.
 */
export interface RaceSvgOpts extends RaceExportOpts {
  progress?: number
}

/**
 * Render a single race frame as a static SVG snapshot. No SMIL — design tools
 * (Figma, Illustrator) that don't support SMIL would otherwise stack every
 * animated state on top of itself and produce garbled output. Layout mirrors
 * `drawRaceFrameCanvas` so a GIF frame and this SVG look identical at the
 * same chapter.
 */
export function exportRaceAsSvg(frame: RaceFrame, opts: RaceSvgOpts): string {
  const {
    width,
    height,
    background = BG_DEFAULT,
    topN = 10,
    maxScore,
    title,
    arcByChapter,
    fontFamily = 'sans-serif',
    fontScale = 1,
    progress = 1,
  } = opts
  const fontSz = (n: number) => (n * fontScale).toFixed(1)

  const layout = computeHeaderLayout(fontScale, !!title)
  const barsTop = layout.barsTop
  const barsLeft = PADDING_X + RANK_LABEL_W
  const barsRight = width - PADDING_X - SCORE_LABEL_W
  const barAreaWidth = Math.max(20, barsRight - barsLeft)
  const barHeight = ROW_HEIGHT - ROW_GAP * 2

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

  // Header — optional title, chapter number, stacked saga–arc subtitle.
  const parts: string[] = []
  parts.push(
    `<rect width="${width}" height="${height}" fill="${esc(background)}"/>`
  )

  if (title) {
    parts.push(
      `<text x="${PADDING_X}" y="${layout.titleBaseY.toFixed(1)}" ` +
        `font-family="${esc(fontFamily)}" font-size="${fontSz(14)}" ` +
        `font-weight="500" fill="#6b7280">${esc(title)}</text>`
    )
  }
  parts.push(
    `<text x="${PADDING_X}" y="${layout.chapterBaseY.toFixed(1)}" ` +
      `font-family="${esc(fontFamily)}" font-weight="700" ` +
      `font-size="${fontSz(32)}" fill="#111827">Chapter ${frame.chapter}</text>`
  )
  const arcTitle = arcByChapter?.get(frame.chapter)
  if (arcTitle) {
    parts.push(
      `<text x="${PADDING_X}" y="${layout.subBaseY.toFixed(1)}" ` +
        `font-family="${esc(fontFamily)}" font-weight="500" ` +
        `font-size="${fontSz(14)}" fill="#6b7280">${esc(arcTitle)}</text>`
    )
  }

  // Rows — rank label + bar + name (inside if it fits, otherwise right of
  // the bar edge) + score, mirroring drawRaceFrameCanvas.
  for (let i = 0; i < topN; i++) {
    const y = barsTop + i * ROW_HEIGHT
    parts.push(
      `<text x="${PADDING_X + RANK_LABEL_W - 8}" ` +
        `y="${y + ROW_HEIGHT / 2 + 4}" text-anchor="end" ` +
        `font-family="${esc(fontFamily)}" font-size="${fontSz(14)}" ` +
        `font-weight="600" fill="#9ca3af">${i + 1}</text>`
    )
    const entry = frame.entries[i]
    if (!entry) continue

    const pct = maxScore > 0 ? Math.max(2, (entry.score / maxScore) * 100) : 0
    const barWidth = (pct / 100) * barAreaWidth
    const barY = y + ROW_GAP
    const color = wordColor(entry.id, entry.isSHP)

    parts.push(
      `<rect x="${barsLeft}" y="${barY}" ` +
        `width="${barWidth.toFixed(2)}" height="${barHeight}" ` +
        `rx="6" ry="6" fill="${color}"/>`
    )

    // Estimate label width at the bar font size. Canvas uses ctx.measureText;
    // here we approximate with ~0.58 × fontSize per char, which is close
    // enough for sans-serif fonts and sidesteps needing a layout engine.
    const nameLabel = entry.isSHP
      ? `${STRAW_HAT_MARKER} ${entry.name}`
      : entry.name
    const labelFontSize = 14 * fontScale
    const approxNameW = nameLabel.length * labelFontSize * 0.58
    const insideFits = barWidth - BAR_INSET * 2 >= approxNameW
    if (insideFits) {
      parts.push(
        `<text x="${barsLeft + BAR_INSET}" y="${barY + barHeight / 2 + 5}" ` +
          `font-family="${esc(fontFamily)}" font-weight="700" ` +
          `font-size="${fontSz(14)}" fill="${isLightColor(color) ? '#111827' : '#ffffff'}">` +
          `${esc(nameLabel)}</text>`
      )
    } else {
      parts.push(
        `<text x="${barsLeft + barWidth + BAR_INSET}" y="${barY + barHeight / 2 + 5}" ` +
          `font-family="${esc(fontFamily)}" font-weight="700" ` +
          `font-size="${fontSz(14)}" fill="#111827">${esc(nameLabel)}</text>`
      )
    }

    parts.push(
      `<text x="${width - PADDING_X}" y="${barY + barHeight / 2 + 5}" ` +
        `text-anchor="end" font-family="${esc(fontFamily)}" ` +
        `font-weight="700" font-size="${fontSz(14)}" fill="#111827">` +
        `${formatScore(entry.score)}</text>`
    )
  }

  // Static progress bar — rail + fill at the requested progress.
  const progressFullW = width - PADDING_X * 2
  const progressY = barsTop + topN * ROW_HEIGHT + 16
  const p = Math.max(0, Math.min(1, progress))
  parts.push(
    `<rect x="${PADDING_X}" y="${progressY}" width="${progressFullW}" ` +
      `height="6" rx="3" ry="3" fill="#e5e7eb"/>`
  )
  parts.push(
    `<rect x="${PADDING_X}" y="${progressY}" ` +
      `width="${Math.max(2, progressFullW * p).toFixed(2)}" ` +
      `height="6" rx="3" ry="3" fill="#3b82f6"/>`
  )

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    parts.join('') +
    `</svg>\n`
  )
}
