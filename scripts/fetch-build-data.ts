// Bulk-fetches the Supabase tables needed at build time (prerender paths,
// loaders, sitemap, OG images) into one JSON file, so the build never issues
// per-page queries.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { BUILD_DATA_PATH, type BuildData } from '../src/data/buildData'

if (process.argv.includes('--if-missing') && existsSync(BUILD_DATA_PATH))
  process.exit(0)

const env = loadEnv('production', process.cwd(), 'VITE_')
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY
if (!url || !key)
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing')
const supabase = createClient(url, key)

const PAGE = 1000

async function fetchAll<T>(
  table: string,
  select: string,
  order: string
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order(order)
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...(data as T[]))
    if (data.length < PAGE) return rows
  }
}

const started = Date.now()
const [
  characters,
  arcs,
  sagas,
  chapters,
  volumes,
  affiliations,
  occupations,
  devilFruits,
] = await Promise.all([
  fetchAll<BuildData['characters'][number]>(
    'character',
    'id,name,origin,status,bounty,age,appearance_count,first_appearance,last_appearance,chapter_list,arc_list,saga_list,is_likely_character',
    'id'
  ),
  fetchAll<BuildData['arcs'][number]>(
    'arc',
    'arc_id,title,start_chapter,end_chapter,saga_id,description',
    'start_chapter'
  ),
  fetchAll<BuildData['sagas'][number]>(
    'saga',
    'saga_id,title,start_chapter,end_chapter,description',
    'start_chapter'
  ),
  fetchAll<BuildData['chapters'][number]>(
    'chapter',
    'number,volume,title,date',
    'number'
  ),
  fetchAll<BuildData['volumes'][number]>('volume', 'number,title', 'number'),
  fetchAll<BuildData['affiliations'][number]>(
    'character_affiliation',
    'character_id,group_name,status',
    'group_name'
  ),
  fetchAll<BuildData['occupations'][number]>(
    'character_occupation',
    'character_id,role,status',
    'role'
  ),
  fetchAll<BuildData['devilFruits'][number]>(
    'character_devil_fruit',
    'character_id,fruit_name,english_name,meaning,fruit_type,is_artificial',
    'fruit_name'
  ),
])

const data: BuildData = {
  fetchedAt: new Date().toISOString(),
  characters: characters.filter((c) => c.name),
  arcs,
  sagas,
  chapters,
  volumes,
  affiliations,
  occupations,
  devilFruits,
}
mkdirSync(dirname(BUILD_DATA_PATH), { recursive: true })
writeFileSync(BUILD_DATA_PATH, JSON.stringify(data))
console.log(
  `Build data: ${data.characters.length} characters, ${arcs.length} arcs, ${sagas.length} sagas, ` +
    `${chapters.length} chapters, ${volumes.length} volumes, ${affiliations.length} affiliation rows, ` +
    `${occupations.length} occupation rows, ${devilFruits.length} devil fruit rows ` +
    `(${Date.now() - started} ms)`
)
