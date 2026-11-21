// Shape of the build-time data snapshot written by scripts/fetch-build-data.ts.
// Pure types and helpers only: safe to import from client code.

export const BUILD_DATA_PATH = '.cache/build-data.json'

export interface BuildCharacter {
  id: string
  name: string
  origin: string | null
  status: string | null
  bounty: number | null
  age: number | null
  appearance_count: number | null
  first_appearance: number | null
  last_appearance: number | null
  chapter_list: number[] | null
  arc_list: string[] | null
  saga_list: string[] | null
  is_likely_character: boolean | null
}

export interface BuildArc {
  arc_id: string
  title: string
  start_chapter: number
  end_chapter: number
  saga_id: string | null
  description: string | null
}

export interface BuildSaga {
  saga_id: string
  title: string
  start_chapter: number
  end_chapter: number
  description: string | null
}

export interface BuildData {
  fetchedAt: string
  characters: BuildCharacter[]
  arcs: BuildArc[]
  sagas: BuildSaga[]
  chapters: {
    number: number
    volume: number | null
    title: string | null
    date: string | null
  }[]
  volumes: { number: number; title: string | null }[]
  affiliations: { character_id: string; group_name: string; status: string }[]
  occupations: { character_id: string; role: string; status: string }[]
  devilFruits: {
    character_id: string
    fruit_name: string
    english_name: string | null
    meaning: string | null
    fruit_type: string | null
    is_artificial: boolean
  }[]
}

export const devilFruitSlug = (fruitName: string) =>
  fruitName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
