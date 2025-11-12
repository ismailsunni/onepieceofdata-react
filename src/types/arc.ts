export interface Arc {
  arc_id: string
  title: string
  japanese_title: string | null
  romanized_title: string | null
  start_chapter: number
  end_chapter: number
  saga_id: string | null
  description: string | null
  saga?: {
    title: string
  }
}

export interface Saga {
  saga_id: string
  title: string
  japanese_title: string | null
  romanized_title: string | null
  start_chapter: number
  end_chapter: number
  description: string | null
}
