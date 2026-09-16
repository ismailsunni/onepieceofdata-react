const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

/** Image files were uploaded under ASCII-folded ids, so accents and invisible
 *  marks must be stripped: Charlotte_Brûlée -> Charlotte_Brulee.png */
export function getCharacterImageUrl(characterId: string): string {
  const fileName = characterId.normalize('NFD').replace(/[^\x20-\x7E]/g, '')
  return `${SUPABASE_URL}/storage/v1/object/public/character-images/${encodeURIComponent(fileName)}.png`
}
