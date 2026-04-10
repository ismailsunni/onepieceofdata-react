#!/usr/bin/env npx tsx
/**
 * Parses OnePieceInsightsPage.tsx for ChartCard usages and updates the
 * chart-index comment block at the top of EmbedInsightPage.tsx.
 *
 * Usage:  npx tsx src/scripts/updateEmbedChartIndex.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAGES_DIR = resolve(__dirname, '..', 'pages')
const INSIGHTS_FILE = resolve(PAGES_DIR, 'OnePieceInsightsPage.tsx')
const EMBED_FILE = resolve(PAGES_DIR, 'EmbedInsightPage.tsx')

interface ChartEntry {
  number: string
  title: string
  slug: string
}

// ── Parse ChartCard blocks from OnePieceInsightsPage ────────────────────────

function extractCharts(): ChartEntry[] {
  const src = readFileSync(INSIGHTS_FILE, 'utf-8')
  const entries: ChartEntry[] = []

  // Match <ChartCard blocks that span multiple lines until the closing >
  // Use a simpler approach: find all chartId values and their nearest title
  const chartIdRegex = /chartId="([^"]+)"/g
  let m: RegExpExecArray | null

  while ((m = chartIdRegex.exec(src)) !== null) {
    const slug = m[1]
    const pos = m.index

    // Look backwards from chartId to find the enclosing <ChartCard
    const before = src.slice(Math.max(0, pos - 500), pos)
    const chartCardStart = before.lastIndexOf('<ChartCard')
    if (chartCardStart === -1) continue

    // Get the full block from <ChartCard to the chartId position + some extra
    const blockStart = Math.max(0, pos - 500) + chartCardStart
    const block = src.slice(blockStart, pos + m[0].length + 10)

    // Extract title — handles both double-quoted and single-quoted
    const titleMatch =
      block.match(/title="([^"]*)"/) || block.match(/title='([^']*)'/)
    if (!titleMatch) continue

    const rawTitle = titleMatch[1]

    // Extract chart number from title like "#1 Cast..." or "#6b One-Saga..."
    const numMatch = rawTitle.match(/^#([\d]+\w?)\s+/)
    const number = numMatch ? numMatch[1] : '?'

    // Clean title: remove the "#N " prefix
    const cleanTitle = numMatch ? rawTitle.slice(numMatch[0].length) : rawTitle

    entries.push({ number, title: cleanTitle, slug })
  }

  return entries
}

// ── Detect interactive filters from EmbedInsightPage ────────────────────────

function detectFilters(): Map<string, string> {
  const src = readFileSync(EMBED_FILE, 'utf-8')
  const filters = new Map<string, string>()

  // Find chartMap entries like: 'slug': <EmbedComponent ... /> or 'slug': (\n<EmbedComponent
  const mapRegex = /'([a-z][\w-]*)'\s*:\s*(?:\(\s*)?<(\w+)/g
  let m: RegExpExecArray | null
  while ((m = mapRegex.exec(src)) !== null) {
    const slug = m[1]
    const component = m[2]

    // Find the component function body — look from "function Component(" to the next top-level "function " or "export "
    const funcStart = src.indexOf(`function ${component}(`)
    if (funcStart === -1) {
      filters.set(slug, '\u2014')
      continue
    }

    // Find the end: next "function " at start of line, or "export " at start of line
    const rest = src.slice(funcStart)
    const endMatch = rest.match(/\n(?=function\s|export\s)/)
    const body = endMatch ? rest.slice(0, endMatch.index!) : rest

    // Check for useState (interactive filters)
    if (!/useState/.test(body)) {
      // No state — but check for SortableTable
      if (/SortableTable/.test(body)) {
        filters.set(slug, 'Sortable table')
      } else {
        filters.set(slug, '\u2014')
      }
      continue
    }

    // Summarise filter types
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
  const COL_NUM = 5
  const COL_TITLE = 40
  const COL_SLUG = 28
  const COL_FILTER = 28

  const hr = (left: string, mid: string, right: string) =>
    `${left}${'─'.repeat(COL_NUM)}${mid}${'─'.repeat(COL_TITLE)}${mid}${'─'.repeat(COL_SLUG)}${mid}${'─'.repeat(COL_FILTER)}${right}`

  const row = (num: string, title: string, slug: string, filter: string) =>
    `│ ${padRight(num, COL_NUM - 2)} │ ${padRight(title, COL_TITLE - 2)} │ ${padRight(slug, COL_SLUG - 2)} │ ${padRight(filter, COL_FILTER - 2)} │`

  const lines = [
    '/**',
    ' * Embed renderers for all insight charts.',
    ' *',
    ' * Each chart is accessible at: /#/embed/insights/<slug>',
    ' * Permalink on the main page:  /#/analytics/insights#<slug>',
    ' *',
    ` * ${hr('┌', '┬', '┐')}`,
    ` * ${row('#', 'Title', 'Slug', 'Interactive Filters')}`,
    ` * ${hr('├', '┼', '┤')}`,
  ]

  for (const chart of charts) {
    const filter = filters.get(chart.slug) || '\u2014'
    lines.push(` * ${row(chart.number, chart.title, chart.slug, filter)}`)
  }

  lines.push(` * ${hr('└', '┴', '┘')}`)
  lines.push(' *')
  lines.push(' * To add a new embed:')
  lines.push(
    ' * 1. Add the compute function call in the `insights` useMemo block'
  )
  lines.push(
    ' * 2. Create an Embed* component that renders the chart with EmbedFooter'
  )
  lines.push(' * 3. Add the slug \u2192 component mapping in `chartMap`')
  lines.push(
    ' * 4. Add chartId and embedPath props to the ChartCard on OnePieceInsightsPage'
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
  const charts = extractCharts()
  if (charts.length === 0) {
    console.error('No ChartCard entries found in OnePieceInsightsPage.tsx')
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
