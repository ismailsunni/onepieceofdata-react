/**
 * Signature colors Oda assigned to each Straw Hat in official colorspreads
 * and SBS corners. Shared across charts so the crew has consistent visual
 * identity wherever they appear — pair with the straw-hat emoji/icon to
 * mark SHP status.
 *
 * Source: One Piece wiki ("Straw Hat Pirates" / SBS volumes).
 *
 * Keys are character IDs from the Supabase `characters` table (the name
 * with spaces replaced by underscores).
 *
 * Hex values are tuned for readability as bar-chart fills behind white,
 * shadowed labels — true canon hues shifted slightly darker/more saturated
 * where needed (e.g. Usopp's yellow bumped to amber).
 */

export const STRAW_HAT_COLORS: Record<string, string> = {
  'Monkey_D._Luffy': '#E53935', // Red (赤)
  Roronoa_Zoro: '#2E7D32', // Green (緑)
  Nami: '#EF6C00', // Orange (オレンジ)
  Usopp: '#F9A825', // Yellow / amber (黄色)
  Sanji: '#1565C0', // Blue (青)
  Nefertari_Vivi: '#C9A961', // White/Gold (白(金))
  Tony_Tony_Chopper: '#D81B60', // Pink (ピンク)
  Nico_Robin: '#6A1B9A', // Purple (紫)
  Franky: '#0277BD', // Light blue (水色)
  Brook: '#212121', // Black, paired with white (白・黒)
  Jinbe: '#A0522D', // Ochre (黄土色)
}

/** Straw-hat emoji used as an inline marker next to SHP names. */
export const STRAW_HAT_MARKER = '\u{1F452}' // 👒

/** Lookup helper — returns undefined for non-SHP characters. */
export function getStrawHatColor(id: string): string | undefined {
  return STRAW_HAT_COLORS[id]
}
