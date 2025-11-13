import { supabase } from './supabase'
import { Chapter } from '../types/chapter'

export async function fetchChapters(): Promise<Chapter[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('chapter')
      .select('*')
      .order('number', { ascending: true })

    if (error) {
      console.error('Error fetching chapters:', error)
      return []
    }

    // Get character counts from coc table
    const { data: cocData, error: cocError } = await supabase
      .from('coc')
      .select('chapter')

    if (cocError) {
      console.error('Error fetching character counts:', cocError)
      // Continue without character counts
      return data || []
    }

    // Count characters per chapter
    const characterCounts = new Map<number, number>()
    cocData?.forEach((coc: { chapter: number }) => {
      const count = characterCounts.get(coc.chapter) || 0
      characterCounts.set(coc.chapter, count + 1)
    })

    // Add character counts to chapters
    const chaptersWithCounts = (data || []).map((chapter) => ({
      ...chapter,
      character_count: characterCounts.get(chapter.number) || 0,
    }))

    return chaptersWithCounts
  } catch (error) {
    console.error('Error in fetchChapters:', error)
    return []
  }
}
