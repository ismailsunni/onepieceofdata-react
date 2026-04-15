#!/usr/bin/env npx tsx
/**
 * Offline generator for the rotating 3D character word cloud.
 *
 * Renders the same Fibonacci-sphere word cloud used by the in-app component,
 * with full control over resolution, duration, frame rate, and metric — so the
 * output can be embedded in slides, social posts, or short videos.
 *
 * Output formats:
 *   - svg          Animated SVG (SMIL). Pure vector, infinite loop, no canvas.
 *   - gif          Animated GIF via gifenc + @napi-rs/canvas.
 *   - png-frames   PNG sequence into --output directory; compose with ffmpeg:
 *                    ffmpeg -framerate 30 -i frame_%04d.png \
 *                      -c:v libx264 -pix_fmt yuv420p -movflags +faststart out.mp4
 *
 * Usage:
 *   npm run wordcloud -- --format gif --width 1200 --height 1200 \
 *     --metric chapter --min 50 --duration 6 --frames 120 \
 *     --output out/word-cloud.gif
 *
 * Required env (read from .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
// gifenc's package.json has `main` → CJS and no `type: "module"`, so Node's
// ESM loader can't pull named exports out of it. Use createRequire to load
// the CJS bundle explicitly; tsx runs this file as ESM but createRequire
// gives us a working CJS import for third-party modules.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { GIFEncoder, applyPalette, quantize } = require('gifenc') as {
  GIFEncoder: typeof import('gifenc').GIFEncoder
  applyPalette: typeof import('gifenc').applyPalette
  quantize: typeof import('gifenc').quantize
}
import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas'
import {
  buildSpherePlacements,
  hashId,
  projectSphere,
  type SpherePlacement,
  type WordCloudItem,
} from '../utils/wordCloud'
import { STRAW_HAT_IDS } from '../constants/characters'
import type { Character } from '../types/character'

// ── CLI arg parsing ────────────────────────────────────────────────────────

type OutputFormat = 'svg' | 'gif' | 'png-frames'
type Metric = 'chapter' | 'cover' | 'arc' | 'saga' | 'bounty'
type ShpFilter = 'all' | 'hide' | 'only'

/** Default --min per metric. Bounty jumps straight to 100M since 1 is useless. */
const DEFAULT_MIN: Record<Metric, number> = {
  chapter: 50,
  cover: 1,
  arc: 1,
  saga: 1,
  bounty: 100_000_000,
}

interface CliArgs {
  format: OutputFormat
  metric: Metric
  min: number
  shp: ShpFilter
  width: number
  height: number
  duration: number
  frames: number
  background: string
  output: string
  fontFamily: string
  /** Bottom-right watermark text. Empty string disables. */
  watermark: string
}

function getArg(name: string, defaultValue?: string): string | undefined {
  const args = process.argv.slice(2)
  const i = args.indexOf(`--${name}`)
  if (i >= 0 && i + 1 < args.length) return args[i + 1]
  return defaultValue
}

function hasFlag(name: string): boolean {
  return process.argv.slice(2).includes(`--${name}`)
}

const USAGE = `Usage: npm run wordcloud -- [options]

Render the rotating 3D character word cloud as an animated SVG, GIF, or a
PNG frame sequence. Reads Supabase credentials from .env.local.

Output
  --format <svg|gif|png-frames>   Output format (default: svg)
  --output <path>                 Output file (svg/gif) or directory
                                  (png-frames). Default: out/word-cloud.<ext>

Data
  --metric <chapter|cover|arc|saga|bounty>
                                  Which metric drives word size (default: chapter)
  --min <N>                       Minimum metric value to include a character.
                                  Per-metric defaults: chapter=50, cover=1,
                                  arc=1, saga=1, bounty=100000000
  --shp <all|hide|only>           Straw Hat filter (default: all)

Rendering
  --width <px>                    Canvas width (default: 1080)
  --height <px>                   Canvas height (default: 1080)
  --duration <sec>                Animation loop duration (default: 6)
  --frames <N>                    Frame count for gif/png-frames (default: 120)
  --background <color>            CSS/hex background (default: #fafafa)

Typography
  --font <family>                 Font family (default: sans-serif)

Branding
  --watermark <text>              Bottom-right watermark (default: onepieceofdata.com)
  --no-watermark                  Disable the watermark

Other
  --help, -h                      Show this help and exit

Examples
  npm run wordcloud -- --format gif --width 1200 --height 1200 \\
    --metric chapter --min 50 --duration 6 --frames 120 \\
    --output out/word-cloud.gif

  npm run wordcloud -- --format svg --metric bounty --min 500000000 \\
    --output out/bounty-cloud.svg

  npm run wordcloud -- --format png-frames --width 1920 --height 1920 \\
    --frames 240 --output out/cloud-frames
`

function parseArgs(): CliArgs {
  const format = (getArg('format', 'svg') as OutputFormat) ?? 'svg'
  if (!['svg', 'gif', 'png-frames'].includes(format)) {
    throw new Error(`--format must be svg | gif | png-frames (got: ${format})`)
  }
  const metric = (getArg('metric', 'chapter') as Metric) ?? 'chapter'
  if (!['chapter', 'cover', 'arc', 'saga', 'bounty'].includes(metric)) {
    throw new Error(`--metric must be chapter | cover | arc | saga | bounty`)
  }
  const shp = (getArg('shp', 'all') as ShpFilter) ?? 'all'
  if (!['all', 'hide', 'only'].includes(shp)) {
    throw new Error(`--shp must be all | hide | only`)
  }
  const defaultOutput =
    format === 'png-frames'
      ? 'out/word-cloud-frames'
      : `out/word-cloud.${format}`
  return {
    format,
    metric,
    min: parseInt(getArg('min', String(DEFAULT_MIN[metric]))!, 10),
    shp,
    width: parseInt(getArg('width', '1080')!, 10),
    height: parseInt(getArg('height', '1080')!, 10),
    duration: parseFloat(getArg('duration', '6')!),
    frames: parseInt(getArg('frames', '120')!, 10),
    background: getArg('background', '#fafafa')!,
    output: getArg('output', defaultOutput)!,
    fontFamily: getArg('font', 'sans-serif')!,
    watermark: hasFlag('no-watermark')
      ? ''
      : (getArg('watermark', 'onepieceofdata.com') ?? 'onepieceofdata.com'),
  }
}

// ── Env ────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..', '..')

function loadEnv(): { url: string; key: string } {
  const envPath = resolve(PROJECT_ROOT, '.env.local')
  if (!existsSync(envPath)) {
    throw new Error(`Missing .env.local at ${envPath}`)
  }
  const raw = readFileSync(envPath, 'utf-8')
  const env: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local'
    )
  }
  return { url, key }
}

// ── Data ───────────────────────────────────────────────────────────────────

function metricValue(c: Character, metric: Metric): number {
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

async function fetchCharacters(url: string, key: string): Promise<Character[]> {
  const supabase = createClient(url, key)
  // Supabase paginates at 1000 rows by default — page through everything.
  const pageSize = 1000
  const all: Character[] = []
  for (let page = 0; ; page++) {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('character')
      .select('*')
      .order('name')
      .range(from, to)
    if (error) throw new Error(`Supabase error: ${error.message}`)
    if (!data || data.length === 0) break
    all.push(...(data as Character[]))
    if (data.length < pageSize) break
  }
  return all
}

function buildItems(
  characters: Character[],
  args: CliArgs
): { items: WordCloudItem[]; minValue: number; maxValue: number } {
  const scored = characters
    .filter((c) => c.name)
    .map<WordCloudItem>((c) => ({
      id: c.id,
      name: c.name as string,
      value: metricValue(c, args.metric),
      isSHP: STRAW_HAT_IDS.has(c.id),
    }))
    .filter((r) =>
      args.shp === 'hide' ? !r.isSHP : args.shp === 'only' ? r.isSHP : true
    )
  const withAny = scored.filter((r) => r.value > 0)
  const maxValue = withAny.reduce((m, r) => (r.value > m ? r.value : m), 0)
  const items = scored
    .filter((r) => r.value >= args.min)
    .sort((a, b) => hashId(a.id) - hashId(b.id))
  return { items, minValue: args.min, maxValue }
}

// ── Renderers ──────────────────────────────────────────────────────────────

/**
 * Bottom-right watermark in a muted gray. Font size scales with the canvas so
 * it reads the same at 1080p and 1920p. Drawn on top of the sphere so it
 * stays legible regardless of what the cloud paints underneath.
 */
function drawWatermarkCanvas(
  ctx: SKRSContext2D,
  text: string,
  width: number,
  height: number,
  fontFamily: string
): void {
  if (!text) return
  const size = Math.max(12, Math.round(Math.min(width, height) * 0.018))
  const padding = Math.round(Math.min(width, height) * 0.02)
  ctx.save()
  ctx.font = `500 ${size}px ${fontFamily}`
  ctx.fillStyle = 'rgba(107, 114, 128, 0.75)' // gray-500 @ 75%
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, width - padding, height - padding)
  ctx.restore()
}

/**
 * Draw one frame of the rotating sphere onto a canvas context. Identical math
 * to the in-browser renderer (z-sort, perspective scale, depth opacity), but
 * uses the @napi-rs/canvas 2D API which mirrors the browser's.
 */
function drawSphereFrame(
  ctx: SKRSContext2D,
  placements: SpherePlacement[],
  rotY: number,
  width: number,
  height: number,
  radius: number,
  background: string,
  fontFamily: string,
  scale: number
): void {
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const projected = placements
    .map((p) => ({ p, ...projectSphere(p.bx, p.by, p.bz, 0, rotY, radius) }))
    .sort((a, b) => a.z - b.z)

  for (const q of projected) {
    ctx.save()
    ctx.globalAlpha = q.opacity
    ctx.translate(q.x, q.y)
    ctx.scale(q.scale, q.scale)
    ctx.fillStyle = q.p.color
    ctx.font = `${q.p.isSHP ? 700 : 500} ${(q.p.size * scale).toFixed(1)}px ${fontFamily}`
    ctx.fillText(q.p.name, 0, 0)
    ctx.restore()
  }
  ctx.restore()
}

/** Pure-vector animated SVG (SMIL). Independent of canvas. */
function renderSvg(placements: SpherePlacement[], args: CliArgs): string {
  const { width, height, duration, frames, background, fontFamily, watermark } =
    args
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
        `font-family="${escape(fontFamily)}" font-weight="${p.isSHP ? 700 : 500}" ` +
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

  // Watermark: static text at bottom-right. Geometry matches the canvas
  // renderer so SVG and GIF/PNG outputs agree on placement and size.
  const wmSize = Math.max(12, Math.round(Math.min(width, height) * 0.018))
  const wmPad = Math.round(Math.min(width, height) * 0.02)
  const watermarkNode = watermark
    ? `<text x="${width - wmPad}" y="${height - wmPad}" ` +
      `text-anchor="end" font-family="${escape(fontFamily)}" ` +
      `font-weight="500" font-size="${wmSize}" ` +
      `fill="rgba(107,114,128,0.75)">${escape(watermark)}</text>`
    : ''

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="${background}"/>` +
    `<g transform="translate(${width / 2},${height / 2})">${texts}</g>` +
    watermarkNode +
    `</svg>\n`
  )
}

async function renderGif(
  placements: SpherePlacement[],
  args: CliArgs
): Promise<Uint8Array> {
  const { width, height, frames, duration, background, fontFamily } = args
  const radius = Math.min(width, height) * 0.42
  // Scale up font sizes proportional to render size (in-app default is 900px
  // canvas; without scaling, text looks tiny on 1080p+ exports).
  const fontScale = Math.min(width, height) / 600

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const gif = GIFEncoder()
  const delayMs = Math.round((duration * 1000) / frames)

  for (let i = 0; i < frames; i++) {
    const rotY = (i / frames) * Math.PI * 2
    drawSphereFrame(
      ctx,
      placements,
      rotY,
      width,
      height,
      radius,
      background,
      fontFamily,
      fontScale
    )
    drawWatermarkCanvas(ctx, args.watermark, width, height, fontFamily)
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = new Uint8Array(
      imgData.data.buffer,
      imgData.data.byteOffset,
      imgData.data.byteLength
    )
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, width, height, { palette, delay: delayMs })
    if ((i + 1) % 10 === 0 || i === frames - 1) {
      process.stdout.write(`\rEncoding GIF: ${i + 1}/${frames}`)
    }
  }
  process.stdout.write('\n')
  gif.finish()
  return gif.bytes()
}

async function renderPngFrames(
  placements: SpherePlacement[],
  args: CliArgs,
  outDir: string
): Promise<void> {
  const { width, height, frames, background, fontFamily } = args
  const radius = Math.min(width, height) * 0.42
  const fontScale = Math.min(width, height) / 600

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const pad = String(frames).length

  for (let i = 0; i < frames; i++) {
    const rotY = (i / frames) * Math.PI * 2
    drawSphereFrame(
      ctx,
      placements,
      rotY,
      width,
      height,
      radius,
      background,
      fontFamily,
      fontScale
    )
    drawWatermarkCanvas(ctx, args.watermark, width, height, fontFamily)
    const buf = await canvas.encode('png')
    const name = `frame_${String(i).padStart(pad, '0')}.png`
    writeFileSync(resolve(outDir, name), buf)
    if ((i + 1) % 10 === 0 || i === frames - 1) {
      process.stdout.write(`\rRendering PNG frames: ${i + 1}/${frames}`)
    }
  }
  process.stdout.write('\n')
  console.log(`Frames written to ${outDir}/frame_${'0'.repeat(pad)}.png`)
  console.log(`Compose with ffmpeg, e.g.:`)
  console.log(
    `  ffmpeg -framerate ${(frames / args.duration).toFixed(2)} -i ${outDir}/frame_%0${pad}d.png ` +
      `-c:v libx264 -pix_fmt yuv420p -movflags +faststart out.mp4`
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (hasFlag('help') || hasFlag('h') || process.argv.includes('-h')) {
    process.stdout.write(USAGE)
    return
  }
  const args = parseArgs()
  console.log('Word cloud generator')
  console.log(
    `  format=${args.format} metric=${args.metric} min=${args.min} shp=${args.shp}`
  )
  console.log(
    `  size=${args.width}x${args.height} duration=${args.duration}s frames=${args.frames}`
  )
  console.log(`  output=${args.output}`)

  // Register a fallback font name → system sans-serif so font-family resolves
  // sensibly on headless boxes. Users can pass --font "DejaVu Sans" etc.
  if (!GlobalFonts.has(args.fontFamily)) {
    // No-op: @napi-rs/canvas falls back to its bundled system fonts.
  }

  const { url, key } = loadEnv()
  console.log('Fetching characters from Supabase…')
  const characters = await fetchCharacters(url, key)
  console.log(`  fetched ${characters.length} characters`)

  const { items, minValue, maxValue } = buildItems(characters, args)
  console.log(`  ${items.length} characters meet filter (max=${maxValue})`)
  if (items.length === 0) {
    throw new Error(
      'No characters match the filter; lower --min or change --metric'
    )
  }

  const placements = buildSpherePlacements(items, minValue, maxValue)

  // Ensure the output directory exists.
  const outAbs = resolve(process.cwd(), args.output)
  const outParent = args.format === 'png-frames' ? outAbs : dirname(outAbs)
  if (!existsSync(outParent)) mkdirSync(outParent, { recursive: true })

  if (args.format === 'svg') {
    const svg = renderSvg(placements, args)
    writeFileSync(outAbs, svg, 'utf-8')
    console.log(`Wrote ${args.output} (${svg.length.toLocaleString()} bytes)`)
  } else if (args.format === 'gif') {
    const bytes = await renderGif(placements, args)
    writeFileSync(outAbs, bytes)
    console.log(`Wrote ${args.output} (${bytes.length.toLocaleString()} bytes)`)
  } else {
    await renderPngFrames(placements, args, outAbs)
  }
}

main().catch((err) => {
  console.error('\nError:', err instanceof Error ? err.message : err)
  process.exit(1)
})
