// Renders a 1200×630 OG card per prerendered page (text and data only, no
// wiki artwork). Cards live in .cache/og (kept between CI runs); a card is
// only re-rendered when its content hash changes.
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { dirname } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import { DEFAULT_OG_IMAGE } from '../src/seo/pages.server'
import type { PageSeo } from '../src/seo/types'

const CACHE_DIR = '.cache/og'
const MANIFEST = `${CACHE_DIR}/manifest.json`
const font = (weight: number) =>
  readFileSync(
    `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`
  )
const fonts = [
  {
    name: 'Inter',
    data: font(400),
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Inter',
    data: font(700),
    weight: 700 as const,
    style: 'normal' as const,
  },
  {
    name: 'Inter',
    data: font(800),
    weight: 800 as const,
    style: 'normal' as const,
  },
]

type Card = { kind: string; heading: string; facts: [string, string][] }

const h = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown
) => ({
  type,
  props: { style, children },
})

// "3,000,000,000 berries" → "3B berries", to fit a stat column
const compact = (value: string) =>
  value.replace(
    /^([\d,]+) berries$/,
    (_, n: string) =>
      `${Intl.NumberFormat('en-US', { notation: 'compact' }).format(Number(n.replace(/,/g, '')))} berries`
  )

const card = ({ kind, heading, facts }: Card) =>
  h(
    'div',
    {
      width: 1200,
      height: 630,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      // Solid fill: a gradient makes each PNG ~5x larger
      background: '#1d4ed8',
      color: 'white',
      fontFamily: 'Inter',
    },
    [
      h(
        'div',
        { display: 'flex', justifyContent: 'space-between', fontSize: 28 },
        [
          h(
            'div',
            {
              color: '#bfdbfe',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 2,
            },
            kind
          ),
          h('div', { fontWeight: 700 }, 'One Piece of Data'),
        ]
      ),
      h(
        'div',
        {
          display: 'flex',
          fontSize: heading.length > 40 ? 56 : heading.length > 24 ? 72 : 88,
          fontWeight: 800,
          lineHeight: 1.1,
        },
        heading
      ),
      h(
        'div',
        { display: 'flex', gap: 56 },
        facts
          .slice(0, 3)
          .map(([label, value]) => [label, compact(value)])
          .map(([label, value]) =>
            h(
              'div',
              { display: 'flex', flexDirection: 'column', maxWidth: 340 },
              [
                h(
                  'div',
                  { fontSize: value.length > 14 ? 32 : 44, fontWeight: 700 },
                  value
                ),
                h('div', { fontSize: 24, color: '#bfdbfe' }, label),
              ]
            )
          )
      ),
      h(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 24,
          color: '#dbeafe',
        },
        [h('div', {}, 'onepieceofdata.com'), h('div', {}, '@onepieceofdata')]
      ),
    ]
  )

async function render(c: Card) {
  // satori accepts plain element objects; its types expect ReactNode
  const svg = await satori(card(c) as never, {
    width: 1200,
    height: 630,
    fonts,
  })
  // Text is already converted to paths by satori: skip system font loading
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng()
}

export async function generateOgImages(
  pages: Iterable<PageSeo>,
  outDir: string
) {
  const manifest: Record<string, string> = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
    : {}
  const cards = new Map<string, Card>([
    [
      DEFAULT_OG_IMAGE,
      {
        kind: 'Open data',
        heading: 'One Piece characters, arcs and stats',
        facts: [],
      },
    ],
  ])
  for (const p of pages) {
    if (p.image !== DEFAULT_OG_IMAGE) {
      cards.set(p.image, { kind: p.kind, heading: p.heading, facts: p.facts })
    }
  }

  let rendered = 0
  for (const [image, c] of cards) {
    const hash = createHash('sha1').update(JSON.stringify(c)).digest('hex')
    const file = CACHE_DIR + image
    if (manifest[image] === hash && existsSync(file)) continue
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, await render(c))
    manifest[image] = hash
    rendered++
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest))
  cpSync(`${CACHE_DIR}/og`, `${outDir}/og`, { recursive: true })
  return { total: cards.size, rendered }
}
