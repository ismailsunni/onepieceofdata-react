export interface Volume {
  number: number
  title: string | null
  chapter_count?: number
  total_pages?: number
  chapter_range?: string
  start_chapter?: number
  end_chapter?: number
}
