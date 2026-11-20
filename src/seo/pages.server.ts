// Builds the SEO model of every prerendered page from the build-time data
// snapshot. The keys of the returned map are the prerender path list.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  BUILD_DATA_PATH,
  devilFruitSlug,
  type BuildCharacter,
  type BuildData,
} from '../data/buildData'
import type { PageSeo, SeoLink } from './types'

export const DEFAULT_OG_IMAGE = '/og/default.png'

const enc = encodeURIComponent
const fmt = (n: number) => n.toLocaleString('en-US')
const plural = (n: number, word: string) =>
  `${fmt(n)} ${word}${n === 1 ? '' : 's'}`

/** Canonical (percent-encoded) form of a URL path, used as the map key. */
export const normalizePath = (path: string) =>
  path
    .split('/')
    .map((s) => enc(decodeURIComponent(s)))
    .join('/')
    .replace(/(.)\/$/, '$1')

const ogImage = (kind: string, path: string) =>
  `/og/${kind}/${createHash('sha1').update(path).digest('hex').slice(0, 12)}.png`

const groupBy = <T>(rows: T[], key: (r: T) => string) => {
  const map = new Map<string, T[]>()
  for (const r of rows) {
    const k = key(r)
    const list = map.get(k)
    if (list) list.push(r)
    else map.set(k, [r])
  }
  return map
}

const byAppearances = (a: BuildCharacter, b: BuildCharacter) =>
  (b.appearance_count ?? 0) - (a.appearance_count ?? 0)

const charLink = (c: BuildCharacter, note?: string): SeoLink => ({
  name: c.name,
  to: `/characters/${enc(c.id)}`,
  note,
})

// Static pages: path → [title, description]
const STATIC_PAGES: Record<string, [string, string]> = {
  '/': [
    'One Piece of Data: One Piece characters, arcs and stats',
    'Explore One Piece through data: every character, arc, saga, chapter, volume and devil fruit, with bounties, appearances and interactive charts.',
  ],
  '/characters': [
    'All One Piece characters',
    'Browse every One Piece character with appearances, bounties, status, origin and affiliations.',
  ],
  '/arcs': [
    'All One Piece story arcs',
    'Every One Piece story arc with chapter ranges, length and characters.',
  ],
  '/sagas': [
    'All One Piece sagas',
    'Every One Piece saga with its arcs, chapter ranges and characters.',
  ],
  '/chapters': [
    'All One Piece chapters',
    'Every One Piece manga chapter with title, volume, release date and characters.',
  ],
  '/volumes': [
    'All One Piece volumes',
    'Every One Piece manga volume with its chapters and characters.',
  ],
  '/affiliations': [
    'One Piece affiliations and crews',
    'Pirate crews, Marine units and organizations in One Piece, with their members.',
  ],
  '/occupations': [
    'One Piece occupations',
    'Occupations and roles held by One Piece characters.',
  ],
  '/devil-fruits': [
    'All One Piece devil fruits',
    'Every One Piece devil fruit with its type, meaning and users.',
  ],
  '/world-top-100': [
    'One Piece World Top 100 character poll',
    'Results of the One Piece World Top 100 character popularity poll, compared with character data.',
  ],
  '/about': [
    'About One Piece of Data',
    'What One Piece of Data is, where the data comes from and how it is built.',
  ],
  '/changelog': [
    'One Piece of Data changelog',
    'New features and changes to One Piece of Data.',
  ],
  '/games': [
    'One Piece games and quizzes',
    'One Piece guessing games and quizzes built from character and chapter data.',
  ],
  '/analytics': [
    'One Piece analytics and insights',
    'Charts and insights on One Piece bounties, appearances, story pacing, demographics and affiliations.',
  ],
  '/analytics/bounty': [
    'One Piece bounty statistics',
    'One Piece bounties analyzed: highest bounties, bounty distribution, bounties by region and blood type.',
  ],
  '/analytics/appearances': [
    'One Piece character appearance statistics',
    'Which One Piece characters appear most, by chapter, arc and saga.',
  ],
  '/analytics/story': [
    'One Piece story and pacing statistics',
    'Arc lengths, publication rate and story pacing across One Piece.',
  ],
  '/analytics/demographics': [
    'One Piece character demographics',
    'Ages, birthdays, blood types and origins of One Piece characters.',
  ],
  '/analytics/characters': [
    'One Piece character statistics',
    'Character counts, debuts and status across One Piece arcs.',
  ],
  '/analytics/affiliations': [
    'One Piece affiliation statistics',
    'The largest crews and organizations in One Piece and how they connect.',
  ],
  '/analytics/data-quality': [
    'One Piece of Data data quality',
    'How complete the One Piece character data is, field by field.',
  ],
  '/analytics/chapter-releases': [
    'One Piece chapter release calendar',
    'One Piece chapter release dates and breaks, week by week.',
  ],
  '/analytics/release-predictor': [
    'One Piece chapter release predictor',
    'When the next One Piece chapters are likely to be released, based on past schedules.',
  ],
}

const LIST_CRUMB: Record<string, string> = {
  characters: 'Characters',
  arcs: 'Arcs',
  sagas: 'Sagas',
  chapters: 'Chapters',
  volumes: 'Volumes',
  affiliations: 'Affiliations',
  occupations: 'Occupations',
  'devil-fruits': 'Devil Fruits',
}

export function buildPages(data: BuildData): Map<string, PageSeo> {
  const pages = new Map<string, PageSeo>()
  const add = (
    p: Omit<PageSeo, 'breadcrumbs'> & { breadcrumbs?: PageSeo['breadcrumbs'] }
  ) => {
    const list = p.path.split('/')[1]
    pages.set(p.path, {
      ...p,
      breadcrumbs: p.breadcrumbs ?? [
        { name: LIST_CRUMB[list], path: `/${list}` },
        { name: p.heading, path: p.path },
      ],
    })
  }

  const chars = data.characters.filter((c) => c.is_likely_character !== false)
  const charById = new Map(data.characters.map((c) => [c.id, c]))
  const arcById = new Map(data.arcs.map((a) => [a.arc_id, a]))
  const sagaById = new Map(data.sagas.map((s) => [s.saga_id, s]))
  const affByChar = groupBy(data.affiliations, (r) => r.character_id)
  const membersByGroup = groupBy(data.affiliations, (r) => r.group_name)
  const occByChar = groupBy(data.occupations, (r) => r.character_id)
  const holdersByRole = groupBy(data.occupations, (r) => r.role)
  const fruitsByChar = groupBy(data.devilFruits, (r) => r.character_id)
  const usersByFruit = groupBy(data.devilFruits, (r) => r.fruit_name)
  const chaptersByVolume = groupBy(
    data.chapters.filter((c) => c.volume != null),
    (c) => String(c.volume)
  )
  const charsByArc = new Map<string, BuildCharacter[]>()
  const charsBySaga = new Map<string, BuildCharacter[]>()
  const charsByChapter = new Map<number, BuildCharacter[]>()
  const push = <K>(map: Map<K, BuildCharacter[]>, k: K, c: BuildCharacter) =>
    map.get(k)?.push(c) ?? map.set(k, [c])
  for (const c of [...chars].sort(byAppearances)) {
    for (const a of c.arc_list ?? []) push(charsByArc, a, c)
    for (const s of c.saga_list ?? []) push(charsBySaga, s, c)
    for (const n of c.chapter_list ?? []) push(charsByChapter, n, c)
  }
  const arcOfChapter = (n: number) =>
    data.arcs.find((a) => a.start_chapter <= n && n <= a.end_chapter)
  const arcLink = (id: string): SeoLink | null => {
    const a = arcById.get(id)
    return a ? { name: `${a.title} Arc`, to: `/arcs/${enc(a.arc_id)}` } : null
  }
  const members = (rows: { character_id: string; status: string }[]) =>
    rows
      .map((r) => ({ c: charById.get(r.character_id), status: r.status }))
      .filter((r): r is { c: BuildCharacter; status: string } => !!r.c)
      .sort((a, b) => byAppearances(a.c, b.c))
      .map((r) => charLink(r.c, r.status === 'current' ? undefined : r.status))

  // Static and list pages
  const allLinks: Record<string, SeoLink[]> = {
    '/characters': [...chars]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => charLink(c)),
    '/arcs': data.arcs.map((a) => arcLink(a.arc_id)!),
    '/sagas': data.sagas.map((s) => ({
      name: `${s.title} Saga`,
      to: `/sagas/${enc(s.saga_id)}`,
    })),
    '/chapters': data.chapters.map((c) => ({
      name: `Chapter ${c.number}${c.title ? `: ${c.title}` : ''}`,
      to: `/chapters/${c.number}`,
    })),
    '/volumes': data.volumes.map((v) => ({
      name: `Volume ${v.number}${v.title ? `: ${v.title}` : ''}`,
      to: `/volumes/${v.number}`,
    })),
    '/affiliations': [...membersByGroup.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((g) => ({ name: g, to: `/affiliations/${enc(g)}` })),
    '/occupations': [...holdersByRole.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((r) => ({ name: r, to: `/occupations/${enc(r)}` })),
    '/devil-fruits': [...usersByFruit.keys()].map((f) => ({
      name: f,
      to: `/devil-fruits/${devilFruitSlug(f)}`,
    })),
  }
  for (const [path, [title, description]] of Object.entries(STATIC_PAGES)) {
    const links = allLinks[path]
    pages.set(path, {
      path,
      kind: 'One Piece of Data',
      heading: title,
      title,
      description,
      image: DEFAULT_OG_IMAGE,
      facts: [],
      sections: links
        ? [{ title: `All ${links.length} entries`, links, collapsed: true }]
        : [],
      breadcrumbs: path === '/' ? [] : [{ name: title, path }],
    })
  }

  for (const c of data.characters) {
    const path = `/characters/${enc(c.id)}`
    const affs = affByChar.get(c.id) ?? []
    const fruits = fruitsByChar.get(c.id) ?? []
    const facts: [string, string][] = []
    if (c.appearance_count)
      facts.push(['Chapters appeared', fmt(c.appearance_count)])
    if (c.bounty) facts.push(['Latest bounty', `${fmt(c.bounty)} berries`])
    if (c.first_appearance)
      facts.push(['First appearance', `Chapter ${c.first_appearance}`])
    if (c.last_appearance)
      facts.push(['Last appearance', `Chapter ${c.last_appearance}`])
    if (c.status) facts.push(['Status', c.status])
    if (c.origin) facts.push(['Origin', c.origin])
    if (c.age) facts.push(['Age', String(c.age)])
    const currentAffs = affs
      .filter((a) => a.status === 'current')
      .map((a) => a.group_name)
    const description = [
      c.appearance_count
        ? `${c.name} appears in ${plural(c.appearance_count, 'One Piece chapter')}` +
          (c.first_appearance
            ? `, first in chapter ${c.first_appearance}.`
            : '.')
        : `${c.name} is a One Piece character.`,
      c.bounty ? `Latest bounty: ${fmt(c.bounty)} berries.` : '',
      currentAffs.length
        ? `Affiliations: ${currentAffs.slice(0, 3).join(', ')}.`
        : '',
      fruits.length
        ? `Devil fruit: ${fruits.map((f) => f.fruit_name).join(', ')}.`
        : '',
    ]
      .filter(Boolean)
      .join(' ')
    add({
      path,
      kind: 'Character',
      heading: c.name,
      title: `${c.name}: appearances, bounty and stats`,
      description,
      image: ogImage('character', path),
      facts,
      sections: [
        {
          title: 'Affiliations',
          links: affs.map((a) => ({
            name: a.group_name,
            to: `/affiliations/${enc(a.group_name)}`,
            note: a.status === 'current' ? undefined : a.status,
          })),
        },
        {
          title: 'Occupations',
          links: (occByChar.get(c.id) ?? []).map((o) => ({
            name: o.role,
            to: `/occupations/${enc(o.role)}`,
            note: o.status === 'current' ? undefined : o.status,
          })),
        },
        {
          title: 'Devil fruit',
          links: fruits.map((f) => ({
            name: f.fruit_name,
            to: `/devil-fruits/${devilFruitSlug(f.fruit_name)}`,
            note: f.english_name ?? undefined,
          })),
        },
        {
          title: 'Arcs',
          links: (c.arc_list ?? [])
            .map(arcLink)
            .filter((l): l is SeoLink => !!l),
        },
      ],
    })
  }

  for (const a of data.arcs) {
    const path = `/arcs/${enc(a.arc_id)}`
    const saga = a.saga_id ? sagaById.get(a.saga_id) : undefined
    const length = a.end_chapter - a.start_chapter + 1
    const cast = charsByArc.get(a.arc_id) ?? []
    add({
      path,
      kind: 'Arc',
      heading: `${a.title} Arc`,
      title: `${a.title} Arc: chapters, characters and stats`,
      description:
        `The ${a.title} Arc spans One Piece chapters ${a.start_chapter} to ${a.end_chapter} ` +
        `(${plural(length, 'chapter')})${saga ? ` in the ${saga.title} Saga` : ''}, ` +
        `with ${plural(cast.length, 'character')}` +
        (cast.length
          ? `, led by ${cast
              .slice(0, 3)
              .map((c) => c.name)
              .join(', ')}.`
          : '.'),
      image: ogImage('arc', path),
      facts: [
        ['Chapters', `${a.start_chapter}–${a.end_chapter}`],
        ['Length', plural(length, 'chapter')],
        ['Characters', fmt(cast.length)],
        ...(saga ? [['Saga', saga.title] as [string, string]] : []),
      ],
      sections: [
        ...(saga
          ? [
              {
                title: 'Saga',
                links: [
                  {
                    name: `${saga.title} Saga`,
                    to: `/sagas/${enc(saga.saga_id)}`,
                  },
                ],
              },
            ]
          : []),
        {
          title: 'Characters',
          links: cast.map((c) => charLink(c)),
          collapsed: cast.length > 30,
        },
        {
          title: 'Chapters',
          links: Array.from({ length }, (_, i) => a.start_chapter + i).map(
            (n) => ({
              name: `Chapter ${n}`,
              to: `/chapters/${n}`,
            })
          ),
          collapsed: true,
        },
      ],
    })
  }

  for (const s of data.sagas) {
    const path = `/sagas/${enc(s.saga_id)}`
    const arcs = data.arcs.filter((a) => a.saga_id === s.saga_id)
    const cast = charsBySaga.get(s.saga_id) ?? []
    const length = s.end_chapter - s.start_chapter + 1
    add({
      path,
      kind: 'Saga',
      heading: `${s.title} Saga`,
      title: `${s.title} Saga: arcs, chapters and characters`,
      description:
        `The ${s.title} Saga covers One Piece chapters ${s.start_chapter} to ${s.end_chapter} ` +
        `(${plural(length, 'chapter')}) across ${plural(arcs.length, 'arc')}: ` +
        `${arcs.map((a) => a.title).join(', ')}.`,
      image: ogImage('saga', path),
      facts: [
        ['Chapters', `${s.start_chapter}–${s.end_chapter}`],
        ['Arcs', fmt(arcs.length)],
        ['Characters', fmt(cast.length)],
      ],
      sections: [
        { title: 'Arcs', links: arcs.map((a) => arcLink(a.arc_id)!) },
        {
          title: 'Characters',
          links: cast.map((c) => charLink(c)),
          collapsed: cast.length > 30,
        },
      ],
    })
  }

  for (const ch of data.chapters) {
    const path = `/chapters/${ch.number}`
    const arc = arcOfChapter(ch.number)
    const cast = charsByChapter.get(ch.number) ?? []
    const name = `Chapter ${ch.number}${ch.title ? `: ${ch.title}` : ''}`
    const facts: [string, string][] = [['Characters', fmt(cast.length)]]
    if (ch.date) facts.push(['Released', ch.date])
    if (ch.volume) facts.push(['Volume', String(ch.volume)])
    if (arc) facts.push(['Arc', arc.title])
    add({
      path,
      kind: 'Chapter',
      heading: name,
      title: `One Piece ${name}`,
      description:
        `One Piece chapter ${ch.number}${ch.title ? `, "${ch.title}"` : ''}` +
        (ch.date ? `, released ${ch.date}` : '') +
        (arc ? `, part of the ${arc.title} Arc` : '') +
        `. ${plural(cast.length, 'character')} appear` +
        (cast.length
          ? `, including ${cast
              .slice(0, 3)
              .map((c) => c.name)
              .join(', ')}.`
          : '.'),
      image: ogImage('chapter', path),
      facts,
      sections: [
        {
          title: 'Story',
          links: [
            ...(arc ? [arcLink(arc.arc_id)!] : []),
            ...(ch.volume
              ? [{ name: `Volume ${ch.volume}`, to: `/volumes/${ch.volume}` }]
              : []),
          ],
        },
        { title: 'Characters', links: cast.map((c) => charLink(c)) },
      ],
    })
  }

  for (const v of data.volumes) {
    const path = `/volumes/${v.number}`
    const chs = chaptersByVolume.get(String(v.number)) ?? []
    const name = `Volume ${v.number}${v.title ? `: ${v.title}` : ''}`
    const range = chs.length
      ? `${chs[0].number}–${chs[chs.length - 1].number}`
      : null
    add({
      path,
      kind: 'Volume',
      heading: name,
      title: `One Piece ${name}`,
      description:
        `One Piece volume ${v.number}${v.title ? `, "${v.title}"` : ''}` +
        (range
          ? `, collects chapters ${range} (${plural(chs.length, 'chapter')}).`
          : '.'),
      image: ogImage('volume', path),
      facts: range
        ? [
            ['Chapters', range],
            ['Chapter count', fmt(chs.length)],
          ]
        : [],
      sections: [
        {
          title: 'Chapters',
          links: chs.map((c) => ({
            name: `Chapter ${c.number}${c.title ? `: ${c.title}` : ''}`,
            to: `/chapters/${c.number}`,
          })),
        },
      ],
    })
  }

  for (const [group, rows] of membersByGroup) {
    // Slashes can't be represented as prerendered file names.
    if (/[/\\]/.test(group)) continue
    const path = `/affiliations/${enc(group)}`
    const links = members(rows)
    const current = rows.filter((r) => r.status === 'current').length
    add({
      path,
      kind: 'Affiliation',
      heading: group,
      title: `${group}: members and stats`,
      description:
        `${group} in One Piece: ${plural(rows.length, 'known member')} (${fmt(current)} current)` +
        (links.length
          ? `, including ${links
              .slice(0, 3)
              .map((l) => l.name)
              .join(', ')}.`
          : '.'),
      image: ogImage('affiliation', path),
      facts: [
        ['Members', fmt(rows.length)],
        ['Current members', fmt(current)],
      ],
      sections: [{ title: 'Members', links }],
    })
  }

  for (const [role, rows] of holdersByRole) {
    if (/[/\\]/.test(role)) continue
    const path = `/occupations/${enc(role)}`
    const links = members(rows)
    add({
      path,
      kind: 'Occupation',
      heading: role,
      title: `${role}: One Piece characters with this occupation`,
      description:
        `${plural(rows.length, 'One Piece character')} ${rows.length === 1 ? 'has' : 'have'} been ${role}` +
        (links.length
          ? `, including ${links
              .slice(0, 3)
              .map((l) => l.name)
              .join(', ')}.`
          : '.'),
      image: ogImage('occupation', path),
      facts: [['Characters', fmt(rows.length)]],
      sections: [{ title: 'Characters', links }],
    })
  }

  for (const [fruit, rows] of usersByFruit) {
    const path = `/devil-fruits/${devilFruitSlug(fruit)}`
    const f = rows[0]
    const users = members(
      rows.map((r) => ({ character_id: r.character_id, status: 'current' }))
    )
    const facts: [string, string][] = []
    if (f.fruit_type) facts.push(['Type', f.fruit_type])
    if (f.english_name) facts.push(['English name', f.english_name])
    if (f.meaning) facts.push(['Meaning', f.meaning])
    facts.push(['Users', fmt(users.length)])
    if (f.is_artificial) facts.push(['Artificial', 'Yes'])
    add({
      path,
      kind: 'Devil Fruit',
      heading: fruit,
      title: `${fruit}${f.english_name ? ` (${f.english_name})` : ''}: devil fruit type and users`,
      description:
        `The ${fruit}${f.english_name ? ` (${f.english_name})` : ''} is ` +
        `${f.is_artificial ? 'an artificial ' : 'a '}${f.fruit_type ? `${f.fruit_type}-type ` : ''}devil fruit` +
        (f.meaning ? ` meaning "${f.meaning}"` : '') +
        (users.length
          ? `. Users: ${users.map((u) => u.name).join(', ')}.`
          : '.'),
      image: ogImage('devil-fruit', path),
      facts,
      sections: [{ title: 'Users', links: users }],
    })
  }

  return pages
}

let cached: Map<string, PageSeo> | null | undefined

/** Pages from the snapshot on disk, or null when it was never fetched (dev). */
export function loadPages(): Map<string, PageSeo> | null {
  if (cached === undefined) {
    try {
      cached = buildPages(JSON.parse(readFileSync(BUILD_DATA_PATH, 'utf8')))
    } catch {
      cached = null
    }
  }
  return cached
}

export const getPageSeo = (pathname: string) =>
  loadPages()?.get(normalizePath(pathname)) ?? null
