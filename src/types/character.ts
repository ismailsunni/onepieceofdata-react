export interface Character {
  id: string
  name: string | null
  origin: string | null
  status: string | null
  birth: string | null
  blood_type: string | null
  blood_type_group: string | null
  bounties: string | null
  bounty: number | null
  age: number | null
  scraping_status: string | null
  scraping_note: string | null
  birth_date: string | null
  chapter_list: number[] | null
  volume_list: number[] | null
  appearance_count: number | null
  volume_appearance_count: number | null
  first_appearance: number | null
  last_appearance: number | null
}
