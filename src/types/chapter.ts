export interface Chapter {
  number: number
  volume: number | null
  title: string | null
  num_page: number | null
  date: string | null
  jump: string | null
  character_count?: number
}
