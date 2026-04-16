#!/usr/bin/env npx tsx
/**
 * Offline generator for the Character Appearance Race chart.
 *
 * Renders the same top-N "bar chart race" animation used by the in-app
 * component, with full control over resolution, duration, sampling, scoring
 * mode, and SHP filter — suitable for slides, social posts, or short videos.
 *
 * Output formats:
 *   - svg          Static single-frame SVG snapshot (no SMIL — design tools
 *                  like Figma/Illustrator don't play SMIL and would otherwise
 *                  render every animated state on top of each other). Use
 *                  --snapshot-chapter to pick the frame; default is the last
 *                  chapter in the range.
 *   - gif          Animated GIF via gifenc + @napi-rs/canvas.
 *   - png-frames   PNG sequence into --output directory; compose with ffmpeg:
 *                    ffmpeg -framerate 30 -i frame_%04d.png \
 *                      -c:v libx264 -pix_fmt yuv420p -movflags +faststart out.mp4
 *
 * Usage:
 *   npm run race -- --format gif --width 1200 --height 680 \
 *     --window 20 --mode decay --duration 15 --frames 180 \
 *     --output out/race.gif
 *
 * Required env (read from .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
// gifenc ships CJS; Node's ESM loader can't destructure named exports from
// it, so pull the CJS bundle via createRequire (same trick as wordcloud CLI).
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { GIFEncoder, applyPalette, quantize } = require('gifenc') as {
  GIFEncoder: typeof import('gifenc').GIFEncoder
  applyPalette: typeof import('gifenc').applyPalette
  quantize: typeof import('gifenc').quantize
}
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import {
  computeRaceFrames,
  type RaceFrame,
  type RaceScoringMode,
} from '../utils/appearanceRace'
import {
  drawRaceFrameCanvas,
  exportRaceAsSvg,
  sampleFrameIndices,
  type RaceExportOpts,
} from '../utils/appearanceRaceExport'
import { STRAW_HAT_IDS } from '../constants/characters'
import type { Character } from '../types/character'
import type { Arc, Saga } from '../types/arc'

// ── CLI arg parsing ────────────────────────────────────────────────────────

type OutputFormat = 'svg' | 'gif' | 'png-frames'
type ShpFilter = 'all' | 'hide' | 'only'

interface CliArgs {
  format: OutputFormat
  window: number
  mode: RaceScoringMode
  shp: ShpFilter
  topN: number
  width: number
  height: number
  duration: number
  frames: number
  startChapter: number | null
  endChapter: number | null
  snapshotChapter: number | null
  background: string
  output: string
  fontFamily: string
  fontScale: number
  title: string | null
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

const USAGE = `Usage: npm run race -- [options]

Render the Character Appearance Race chart as an animated GIF, SMIL SVG,
or a PNG frame sequence. Reads Supabase credentials from .env.local.

Output
  --format <svg|gif|png-frames>   Output format (default: gif)
  --output <path>                 Output file (gif/svg) or directory
                                  (png-frames). Default: out/appearance-race.<ext>

Data / scoring
  --window <N>                    Window size in chapters (default: 20)
  --mode <window|decay>           Scoring mode. 'decay' = EMA half-life,
                                  'window' = hard sliding count (default: decay)
  --shp <all|hide|only>           Straw Hat filter (default: all)
  --top <N>                       How many top ranks to show (default: 10)
  --start-chapter <N>             Slice from this chapter (inclusive)
  --end-chapter <N>               Slice to this chapter (inclusive)
  --snapshot-chapter <N>          [svg only] Chapter to render in the static
                                  SVG snapshot (default: last chapter in range)

Rendering
  --width <px>                    Canvas width (default: 1200)
  --height <px>                   Canvas height (default: 680)
  --duration <sec>                Animation duration in seconds (default: 15)
  --frames <N>                    Sampled frame count (default: 180)
  --background <color>            CSS/hex background (default: #fafafa)
  --title <text>                  Optional title printed above "Chapter NNN"

Typography
  --font <family>                 Font family (default: sans-serif)
  --font-scale <N>                Multiplier on label sizes (default: 1.4)

Branding
  --watermark <text>              Bottom-right watermark (default: onepieceofdata.com)
  --no-watermark                  Disable the watermark

Other
  --help, -h                      Show this help and exit

Examples
  npm run race -- --format gif --duration 20 --frames 240 \\
    --output out/full-race.gif

  npm run race -- --format svg --mode window --window 10 \\
    --shp only --output out/shp-race.svg

  npm run race -- --format png-frames --width 1920 --height 1080 \\
    --font-scale 2 --output out/race-frames
`

function parseArgs(): CliArgs {
  const format = (getArg('format', 'gif') as OutputFormat) ?? 'gif'
  if (!['svg', 'gif', 'png-frames'].includes(format)) {
    throw new Error(`--format must be svg | gif | png-frames (got: ${format})`)
  }
  const mode = (getArg('mode', 'decay') as RaceScoringMode) ?? 'decay'
  if (!['window', 'decay', 'cumulative'].includes(mode)) {
    throw new Error(`--mode must be window | decay | cumulative (got: ${mode})`)
  }
  const shp = (getArg('shp', 'all') as ShpFilter) ?? 'all'
  if (!['all', 'hide', 'only'].includes(shp)) {
    throw new Error(`--shp must be all | hide | only`)
  }
  const defaultOutput =
    format === 'png-frames'
      ? 'out/appearance-race-frames'
      : `out/appearance-race.${format}`
  const startArg = getArg('start-chapter')
  const endArg = getArg('end-chapter')
  const snapshotArg = getArg('snapshot-chapter')
  const titleArg = getArg('title')
  return {
    format,
    window: parseInt(getArg('window', '20')!, 10),
    mode,
    shp,
    topN: parseInt(getArg('top', '10')!, 10),
    width: parseInt(getArg('width', '1200')!, 10),
    height: parseInt(getArg('height', '680')!, 10),
    duration: parseFloat(getArg('duration', '15')!),
    frames: parseInt(getArg('frames', '180')!, 10),
    startChapter: startArg ? parseInt(startArg, 10) : null,
    endChapter: endArg ? parseInt(endArg, 10) : null,
    snapshotChapter: snapshotArg ? parseInt(snapshotArg, 10) : null,
    background: getArg('background', '#fafafa')!,
    output: getArg('output', defaultOutput)!,
    fontFamily: getArg('font', 'sans-serif')!,
    fontScale: parseFloat(getArg('font-scale', '1.4')!),
    title: titleArg ?? null,
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

async function fetchAll<T>(
  url: string,
  key: string,
  table: string,
  order: string
): Promise<T[]> {
  const supabase = createClient(url, key)
  const pageSize = 1000
  const all: T[] = []
  for (let page = 0; ; page++) {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(order)
      .range(from, to)
    if (error) throw new Error(`Supabase error on ${table}: ${error.message}`)
    if (!data || data.length === 0) break
    all.push(...(data as T[]))
    if (data.length < pageSize) break
  }
  return all
}

// ── Renderers ──────────────────────────────────────────────────────────────

async function renderGif(
  frames: RaceFrame[],
  opts: RaceExportOpts,
  args: CliArgs
): Promise<Uint8Array> {
  const { width, height } = args
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const indices = sampleFrameIndices(frames.length, args.frames)
  const delayMs = Math.max(
    20,
    Math.round((args.duration * 1000) / indices.length)
  )

  const gif = GIFEncoder()

  for (let i = 0; i < indices.length; i++) {
    const frame = frames[indices[i]]
    drawRaceFrameCanvas(ctx as unknown as CanvasRenderingContext2D, frame, {
      ...opts,
      progress: indices.length === 1 ? 1 : i / (indices.length - 1),
    })
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = new Uint8Array(
      imgData.data.buffer,
      imgData.data.byteOffset,
      imgData.data.byteLength
    )
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, width, height, { palette, delay: delayMs })
    if ((i + 1) % 10 === 0 || i === indices.length - 1) {
      process.stdout.write(`\rEncoding GIF: ${i + 1}/${indices.length}`)
    }
  }
  process.stdout.write('\n')
  gif.finish()
  return gif.bytes()
}

async function renderPngFrames(
  frames: RaceFrame[],
  opts: RaceExportOpts,
  args: CliArgs,
  outDir: string
): Promise<void> {
  const { width, height } = args
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d') as unknown as SKRSContext2D
  const indices = sampleFrameIndices(frames.length, args.frames)
  const pad = String(indices.length).length

  for (let i = 0; i < indices.length; i++) {
    const frame = frames[indices[i]]
    drawRaceFrameCanvas(ctx as unknown as CanvasRenderingContext2D, frame, {
      ...opts,
      progress: indices.length === 1 ? 1 : i / (indices.length - 1),
    })
    const buf = await canvas.encode('png')
    const name = `frame_${String(i).padStart(pad, '0')}.png`
    writeFileSync(resolve(outDir, name), buf)
    if ((i + 1) % 10 === 0 || i === indices.length - 1) {
      process.stdout.write(`\rRendering PNG frames: ${i + 1}/${indices.length}`)
    }
  }
  process.stdout.write('\n')
  console.log(`Frames written to ${outDir}/frame_${'0'.repeat(pad)}.png`)
  console.log(`Compose with ffmpeg, e.g.:`)
  console.log(
    `  ffmpeg -framerate ${(indices.length / args.duration).toFixed(2)} ` +
      `-i ${outDir}/frame_%0${pad}d.png ` +
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
  console.log('Appearance race generator')
  console.log(
    `  format=${args.format} mode=${args.mode} window=${args.window} shp=${args.shp} topN=${args.topN}`
  )
  console.log(
    `  size=${args.width}x${args.height} duration=${args.duration}s frames=${args.frames}`
  )
  if (args.startChapter !== null || args.endChapter !== null) {
    console.log(
      `  chapters=${args.startChapter ?? '(start)'}..${args.endChapter ?? '(end)'}`
    )
  }
  console.log(`  output=${args.output}`)

  const { url, key } = loadEnv()
  console.log('Fetching characters + arcs + sagas from Supabase…')
  const [characters, arcs, sagas] = await Promise.all([
    fetchAll<Character>(url, key, 'character', 'name'),
    fetchAll<Arc>(url, key, 'arc', 'start_chapter'),
    fetchAll<Saga>(url, key, 'saga', 'start_chapter'),
  ])
  console.log(
    `  fetched ${characters.length} characters, ${arcs.length} arcs, ${sagas.length} sagas`
  )

  // Compute frames. Smoothing on = decay mode + hysteresis (ranks 6-10 only),
  // matching the in-app default. Plain 'window' mode turns both off for a
  // faithful raw sliding-count race.
  const { frames, minChapter, maxChapter, maxScore } = computeRaceFrames({
    characters,
    shpIds: STRAW_HAT_IDS,
    windowSize: args.window,
    topN: args.topN + 5, // buffer slots for smooth enter/exit
    shpFilter: args.shp,
    scoringMode: args.mode,
    hysteresisMargin: args.mode === 'decay' ? 1.0 : 0,
    hysteresisMinRank: 6,
  })
  if (frames.length === 0) {
    throw new Error('No race frames produced — check filters / data.')
  }
  console.log(
    `  computed ${frames.length} frames (chapters ${minChapter}..${maxChapter}, maxScore=${maxScore.toFixed(2)})`
  )

  // Optional chapter slice — trim the frame array to the requested range.
  const startCh = Math.max(minChapter, args.startChapter ?? minChapter)
  const endCh = Math.min(maxChapter, args.endChapter ?? maxChapter)
  const sliced = frames.filter(
    (f) => f.chapter >= startCh && f.chapter <= endCh
  )
  if (sliced.length === 0) {
    throw new Error(
      `No frames in chapter range ${startCh}..${endCh}; widen --start-chapter/--end-chapter`
    )
  }

  // "Saga — Arc" subtitle lookup. Sagas bracket arcs by chapter range, so
  // for each chapter we pick the containing saga and prefix the arc title.
  const arcByChapter = new Map<number, string>()
  for (const arc of arcs) {
    const saga = sagas.find(
      (s) =>
        arc.start_chapter >= s.start_chapter &&
        arc.start_chapter <= s.end_chapter
    )
    const label = saga ? `${saga.title} — ${arc.title}` : arc.title
    for (let c = arc.start_chapter; c <= arc.end_chapter; c++) {
      arcByChapter.set(c, label)
    }
  }

  const exportOpts: RaceExportOpts = {
    width: args.width,
    height: args.height,
    frames: args.frames,
    duration: args.duration,
    background: args.background,
    topN: args.topN,
    maxScore,
    arcByChapter,
    title: args.title ?? undefined,
    fontFamily: args.fontFamily,
    fontScale: args.fontScale,
    watermark: args.watermark,
  }

  // Ensure the output directory exists.
  const outAbs = resolve(process.cwd(), args.output)
  const outParent = args.format === 'png-frames' ? outAbs : dirname(outAbs)
  if (!existsSync(outParent)) mkdirSync(outParent, { recursive: true })

  if (args.format === 'svg') {
    // Pick the snapshot frame. Default: last frame in range (end of race);
    // --snapshot-chapter lets the user lock onto any specific chapter.
    const targetChapter =
      args.snapshotChapter ?? sliced[sliced.length - 1].chapter
    const snapshot = sliced.find((f) => f.chapter === targetChapter)
    if (!snapshot) {
      throw new Error(
        `--snapshot-chapter ${targetChapter} not found in range ${startCh}..${endCh}`
      )
    }
    const progress =
      endCh > startCh ? (snapshot.chapter - startCh) / (endCh - startCh) : 1
    const svg = exportRaceAsSvg(snapshot, { ...exportOpts, progress })
    writeFileSync(outAbs, svg, 'utf-8')
    console.log(
      `Wrote ${args.output} (chapter ${snapshot.chapter}, ${svg.length.toLocaleString()} bytes)`
    )
  } else if (args.format === 'gif') {
    const bytes = await renderGif(sliced, exportOpts, args)
    writeFileSync(outAbs, bytes)
    console.log(`Wrote ${args.output} (${bytes.length.toLocaleString()} bytes)`)
  } else {
    await renderPngFrames(sliced, exportOpts, args, outAbs)
  }
}

main().catch((err) => {
  console.error('\nError:', err instanceof Error ? err.message : err)
  process.exit(1)
})
