/**
 * Exporters for the 3D rotating word-cloud sphere. Produces GIF, animated SVG
 * (SMIL), or WebM from the same shared placement data used by the live render.
 *
 * All three outputs depict a full 2π rotation around the Y axis so the loop
 * seams cleanly.
 */
import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import type { SpherePlacement } from './wordCloud'
import { projectSphere } from './wordCloud'

export interface ExportOpts {
  width: number
  height: number
  /** Loop duration (in seconds for SVG/WebM, informational for GIF frames). */
  duration?: number
  /** Frame count for rasterised outputs. */
  frames?: number
  /** Background color (hex or CSS). */
  background?: string
}

const BG_DEFAULT = '#fafafa'

/** Render a single frame of the sphere to the given 2D canvas context. */
function drawSphereFrame(
  ctx: CanvasRenderingContext2D,
  placements: SpherePlacement[],
  rotX: number,
  rotY: number,
  width: number,
  height: number,
  radius: number,
  background: string
): void {
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const projected = placements
    .map((p) => ({ p, ...projectSphere(p.bx, p.by, p.bz, rotX, rotY, radius) }))
    .sort((a, b) => a.z - b.z)

  for (const q of projected) {
    ctx.save()
    ctx.globalAlpha = q.opacity
    ctx.translate(q.x, q.y)
    ctx.scale(q.scale, q.scale)
    ctx.fillStyle = q.p.color
    ctx.font = `${q.p.isSHP ? 700 : 500} ${q.p.size}px sans-serif`
    ctx.fillText(q.p.name, 0, 0)
    ctx.restore()
  }
  ctx.restore()
}

/**
 * Encode a full-rotation loop as a GIF. Runs client-side via gifenc; palette
 * is quantised per-frame so the random-hue palette survives reasonably well.
 */
export async function exportSphereAsGif(
  placements: SpherePlacement[],
  opts: ExportOpts
): Promise<Blob> {
  const {
    width,
    height,
    frames = 90,
    duration = 3,
    background = BG_DEFAULT,
  } = opts
  const radius = Math.min(width, height) * 0.42
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvas 2d context unavailable')

  const gif = GIFEncoder()
  const delayMs = Math.round((duration * 1000) / frames)

  for (let i = 0; i < frames; i++) {
    const rotY = (i / frames) * Math.PI * 2
    drawSphereFrame(ctx, placements, 0, rotY, width, height, radius, background)
    const { data } = ctx.getImageData(0, 0, width, height)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, width, height, { palette, delay: delayMs })
    // Yield so the UI thread can breathe during encoding.
    if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0))
  }
  gif.finish()
  // gif.bytes() is Uint8Array; cast via BlobPart for TS's strict BufferSource.
  return new Blob([gif.bytes() as BlobPart], { type: 'image/gif' })
}

/**
 * Build a self-animating SVG using SMIL. Each word gets two <animate> tags —
 * one for its `transform` (translate + scale), one for `opacity` — driven by
 * a pre-computed keyframe list that walks a full Y-axis rotation. File is
 * pure vector and loops indefinitely when viewed in a browser.
 */
export function exportSphereAsSvg(
  placements: SpherePlacement[],
  opts: ExportOpts
): string {
  const {
    width,
    height,
    frames = 60,
    duration = 6,
    background = BG_DEFAULT,
  } = opts
  const radius = Math.min(width, height) * 0.42

  const keyTimes: string[] = []
  for (let i = 0; i <= frames; i++) keyTimes.push((i / frames).toFixed(4))
  const keyTimesStr = keyTimes.join(';')

  const escape = (s: string) =>
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

  // Split translate and scale into separate <animateTransform> elements.
  // Animating `transform` as a single composite value via <animate> is
  // unreliable across browsers; <animateTransform> with type="translate" /
  // type="scale" + additive="sum" is the standardised path that actually
  // rotates in Chrome, Firefox, and Safari.
  const texts = placements
    .map((p) => {
      const translates: string[] = []
      const scales: string[] = []
      const opacities: string[] = []
      for (let i = 0; i <= frames; i++) {
        const rotY = (i / frames) * Math.PI * 2
        const pr = projectSphere(p.bx, p.by, p.bz, 0, rotY, radius)
        translates.push(`${pr.x.toFixed(2)},${pr.y.toFixed(2)}`)
        scales.push(pr.scale.toFixed(3))
        opacities.push(pr.opacity.toFixed(3))
      }
      return (
        `<text text-anchor="middle" dominant-baseline="central" ` +
        `font-family="sans-serif" font-weight="${p.isSHP ? 700 : 500}" ` +
        `font-size="${p.size.toFixed(1)}" fill="${p.color}" ` +
        `opacity="${opacities[0]}">` +
        `<animateTransform attributeName="transform" type="translate" ` +
        `dur="${duration}s" repeatCount="indefinite" ` +
        `values="${translates.join(';')}" keyTimes="${keyTimesStr}"/>` +
        `<animateTransform attributeName="transform" type="scale" ` +
        `additive="sum" dur="${duration}s" repeatCount="indefinite" ` +
        `values="${scales.join(';')}" keyTimes="${keyTimesStr}"/>` +
        `<animate attributeName="opacity" dur="${duration}s" ` +
        `repeatCount="indefinite" values="${opacities.join(';')}" ` +
        `keyTimes="${keyTimesStr}"/>` +
        `${escape(p.name)}` +
        `</text>`
      )
    })
    .join('')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="${background}"/>` +
    `<g transform="translate(${width / 2},${height / 2})">${texts}</g>` +
    `</svg>\n`
  )
}

/**
 * Record a full-rotation loop as WebM using the MediaRecorder + captureStream
 * pipeline. VP9 if available, VP8 otherwise. The recording runs at real time
 * for `duration` seconds.
 */
export async function exportSphereAsWebM(
  placements: SpherePlacement[],
  opts: ExportOpts
): Promise<Blob> {
  const { width, height, duration = 4, background = BG_DEFAULT } = opts
  const radius = Math.min(width, height) * 0.42
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  // Chromium (and some Firefox builds) capture empty frames from a detached
  // canvas. Mount the canvas off-screen so captureStream sees it as a live
  // rendering surface. Cleaned up in the finally block below.
  canvas.style.cssText =
    'position:fixed;left:-99999px;top:0;pointer-events:none;opacity:0'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    throw new Error('canvas 2d context unavailable')
  }

  if (
    typeof MediaRecorder === 'undefined' ||
    typeof canvas.captureStream !== 'function'
  ) {
    canvas.remove()
    throw new Error('WebM recording is not supported in this browser')
  }

  try {
    // Prime the first frame before starting capture so the recording doesn't
    // open with a blank canvas.
    drawSphereFrame(ctx, placements, 0, 0, width, height, radius, background)

    const stream = canvas.captureStream(30)
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm'
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 4_000_000,
    })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const done = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        if (chunks.length === 0) {
          reject(
            new Error(
              'WebM recorder produced no data. Try GIF instead, or update your browser.'
            )
          )
          return
        }
        resolve(new Blob(chunks, { type: 'video/webm' }))
      }
      recorder.onerror = (e) => {
        const evt = e as Event & { error?: Error }
        reject(evt.error ?? new Error('MediaRecorder error'))
      }
    })

    // Request a data chunk every 100ms — ensures the encoder is actually
    // producing output during the recording, not only at stop time.
    recorder.start(100)
    const startTime = performance.now()
    const durationMs = duration * 1000

    await new Promise<void>((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - startTime
        if (elapsed >= durationMs) {
          // Let the last animated frame commit before stopping the recorder.
          requestAnimationFrame(() => {
            if (recorder.state !== 'inactive') recorder.stop()
            resolve()
          })
          return
        }
        const rotY = (elapsed / durationMs) * Math.PI * 2
        drawSphereFrame(
          ctx,
          placements,
          0,
          rotY,
          width,
          height,
          radius,
          background
        )
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    return await done
  } finally {
    canvas.remove()
  }
}

/** Trigger a browser download for the given blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
