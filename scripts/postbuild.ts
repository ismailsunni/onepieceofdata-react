// Writes sitemap.xml, robots.txt and OG cards into the build output, from the
// same page list as the prerender config. Set SKIP_OG=1 to skip the cards.
import { readFileSync, writeFileSync } from 'node:fs'
import { loadEnv } from 'vite'
import { BUILD_DATA_PATH } from '../src/data/buildData'
import { loadPages } from '../src/seo/pages.server'
import { generateOgImages } from './generate-og'

const OUT = 'build/client'
const env = loadEnv('production', process.cwd(), 'VITE_')
const site = (env.VITE_SITE_URL || 'https://onepieceofdata.com').replace(
  /\/$/,
  ''
)
const pages = loadPages()
if (!pages) throw new Error('Missing build data')
const lastmod = JSON.parse(
  readFileSync(BUILD_DATA_PATH, 'utf8')
).fetchedAt.slice(0, 10)

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const urls = [...pages.keys()].map(
  (p) => `  <url><loc>${esc(site + p)}</loc><lastmod>${lastmod}</lastmod></url>`
)
writeFileSync(
  `${OUT}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
)
writeFileSync(
  `${OUT}/robots.txt`,
  `User-agent: *\nAllow: /\nDisallow: /embed/\n\nSitemap: ${site}/sitemap.xml\n`
)
console.log(`Sitemap: ${urls.length} URLs (lastmod ${lastmod})`)

if (!process.env.SKIP_OG) {
  const started = Date.now()
  const og = await generateOgImages(pages.values(), OUT)
  console.log(
    `OG cards: ${og.rendered} rendered, ${og.total - og.rendered} unchanged (${Date.now() - started} ms)`
  )
}
