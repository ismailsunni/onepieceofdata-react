import type { Config } from '@react-router/dev/config'
import { loadPages } from './src/seo/pages.server'

const pages = loadPages()
if (!pages)
  throw new Error('Missing build data: run `npm run fetch-data` first')

export default {
  appDirectory: 'src',
  ssr: false,
  // Every page with SEO data is prerendered (paths decoded: they become file
  // names); other routes (games, chat,
  // interactive tools) are served by the SPA fallback.
  prerender: {
    paths: [...pages.keys()].map(decodeURIComponent),
    concurrency: 8,
  },
} satisfies Config
