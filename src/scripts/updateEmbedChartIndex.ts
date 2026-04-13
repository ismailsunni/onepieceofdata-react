#!/usr/bin/env npx tsx
/**
 * Parses insight section components for ChartCard usages and updates the
 * chart-index comment block at the top of EmbedInsightPage.tsx.
 *
 * Usage:  npx tsx src/scripts/updateEmbedChartIndex.ts
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAGES_DIR = resolve(__dirname, '..', 'pages')
const INSIGHTS_DIR = resolve(__dirname, '..', 'components', 'insights')
const EMBED_FILE = resolve(PAGES_DIR, 'EmbedInsightPage.tsx')

interface ChartEntry {
  title: string
  slug: string
}

// ── Parse ChartCard blocks from insight section components ──────────────────

function extractCharts(): ChartEntry[] {
  // Scan all *Section.tsx files in the insights components directory
  const sectionFiles = readdirSync(INSIGHTS_DIR)
    .filter((f) => f.endsWith('Section.tsx'))
    .map((f) => resolve(INSIGHTS_DIR, f))

  const filesToScan = [...sectionFiles]

  const entries: ChartEntry[] = []

  for (const file of filesToScan) {
    let src: string
    try {
      src = readFileSync(file, 'utf-8')
    } catch {
      continue
    }

    const chartIdRegex = /chartId="([^"]+)"/g
    let m: RegExpExecArray | null

    while ((m = chartIdRegex.exec(src)) !== null) {
      const slug = m[1]
      const pos = m.index

      const before = src.slice(Math.max(0, pos - 500), pos)
      const chartCardStart = before.lastIndexOf('<ChartCard')
      if (chartCardStart === -1) continue

      const blockStart = Math.max(0, pos - 500) + chartCardStart
      const block = src.slice(blockStart, pos + m[0].length + 10)

      const titleMatch =
        block.match(/title="([^"]*)"/) || block.match(/title='([^']*)'/)
      if (!titleMatch) continue

      entries.push({ title: titleMatch[1], slug })
    }
  }

  return entries
}

// ── Detect interactive filters from EmbedInsightPage ────────────────────────

function detectFilters(): Map<string, string> {
  const embedSrc = readFileSync(EMBED_FILE, 'utf-8')
  const filters = new Map<string, string>()

  // Collect all Embed*Charts.tsx source files
  const embedChartFiles = readdirSync(INSIGHTS_DIR)
    .filter((f) => f.startsWith('Embed') && f.endsWith('.tsx'))
    .map((f) => readFileSync(resolve(INSIGHTS_DIR, f), 'utf-8'))
  const allEmbedSrc = embedChartFiles.join('\n')

  // Find chartMap entries like: 'slug': <EmbedComponent ... /> or 'slug': (\n<EmbedComponent
  const mapRegex = /'([a-z][\w-]*)'\s*:\s*(?:\(\s*)?<(\w+)/g
  let m: RegExpExecArray | null
  while ((m = mapRegex.exec(embedSrc)) !== null) {
    const slug = m[1]
    const component = m[2]

    // Find the component function body in the embed chart files
    const funcStart = allEmbedSrc.indexOf(`function ${component}(`)
    if (funcStart === -1) {
      filters.set(slug, '\u2014')
      continue
    }

    const rest = allEmbedSrc.slice(funcStart)
    const endMatch = rest.match(/\n(?=function\s|export\s)/)
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest

    if (!/useState/.test(body)) {
      if (/SortableTable/.test(body)) {
        filters.set(slug, 'Sortable table')
      } else {
        filters.set(slug, '\u2014')
      }
      continue
    }

    const parts: string[] = []
    if (/shpFilter|hideStrawHats|SHPFilter/.test(body)) {
      if (/['"]all['"][\s\S]*?['"]hide['"][\s\S]*?['"]only['"]/.test(body)) {
        parts.push('SHP 3-way')
      } else {
        parts.push('SHP toggle')
      }
    }
    if (/showPct|Percent|setPct/.test(body)) parts.push('Count / %')
    if (/setMode\b/.test(body)) parts.push('Both / New / Returning')
    if (/SortableTable/.test(body)) parts.push('Sortable table')

    filters.set(slug, parts.length > 0 ? parts.join(' + ') : '\u2014')
  }

  return filters
}

// ── Generate the comment block ──────────────────────────────────────────────

function padRight(str: string, len: number): string {
  return str + ' '.repeat(Math.max(0, len - str.length))
}

function buildComment(
  charts: ChartEntry[],
  filters: Map<string, string>
): string {
  const COL_TITLE = 48
  const COL_SLUG = 28
  const COL_FILTER = 28

  const hr = (left: string, mid: string, right: string) =>
    `${left}${'─'.repeat(COL_TITLE)}${mid}${'─'.repeat(COL_SLUG)}${mid}${'─'.repeat(COL_FILTER)}${right}`

  const row = (title: string, slug: string, filter: string) =>
    `│ ${padRight(title, COL_TITLE - 2)} │ ${padRight(slug, COL_SLUG - 2)} │ ${padRight(filter, COL_FILTER - 2)} │`

  const lines = [
    '/**',
    ' * Embed renderers for all insight charts.',
    ' *',
    ' * Each chart is accessible at: /#/embed/insights/<slug>',
    ' * Permalink on the main page:  /#/analytics/<topic>#<slug>',
    ' *',
    ` * ${hr('┌', '┬', '┐')}`,
    ` * ${row('Title', 'Slug', 'Interactive Filters')}`,
    ` * ${hr('├', '┼', '┤')}`,
  ]

  for (const chart of charts) {
    const filter = filters.get(chart.slug) || '\u2014'
    lines.push(` * ${row(chart.title, chart.slug, filter)}`)
  }

  lines.push(` * ${hr('└', '┴', '┘')}`)
  lines.push(' *')
  lines.push(' * To add a new embed:')
  lines.push(
    ' * 1. Add the compute function call in the `insights` useMemo block'
  )
  lines.push(
    ' * 2. Create an Embed* component in src/components/insights/Embed*Charts.tsx'
  )
  lines.push(' * 3. Add the slug \u2192 component mapping in `chartMap`')
  lines.push(
    ' * 4. Add chartId and embedPath props to the ChartCard in the relevant insight section'
  )
  lines.push(' *')
  lines.push(
    ' * Auto-generated by: npx tsx src/scripts/updateEmbedChartIndex.ts'
  )
  lines.push(' */')

  return lines.join('\n')
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const charts = extractCharts().sort((a, b) => a.title.localeCompare(b.title))
  if (charts.length === 0) {
    console.error('No ChartCard entries found in insight section components')
    process.exit(1)
  }

  const filters = detectFilters()
  const comment = buildComment(charts, filters)

  // Replace existing comment block in EmbedInsightPage
  const src = readFileSync(EMBED_FILE, 'utf-8')
  const commentBlockRegex = /^\/\*\*[\s\S]*?\*\/\n/
  let updated: string

  if (commentBlockRegex.test(src)) {
    updated = src.replace(commentBlockRegex, comment + '\n')
  } else {
    updated = comment + '\n' + src
  }

  writeFileSync(EMBED_FILE, updated, 'utf-8')
  console.log(
    `Updated chart index in EmbedInsightPage.tsx (${charts.length} charts)`
  )
}

main()
