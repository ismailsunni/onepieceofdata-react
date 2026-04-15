/**
 * Signature colors Oda assigned to each Straw Hat in official colorspreads
 * and SBS corners. Shared across charts so the crew has consistent visual
 * identity wherever they appear — pair with the straw-hat emoji/icon to
 * mark SHP status.
 *
 * Source: One Piece wiki ("Straw Hat Pirates" / SBS volumes), matched to
 * the reference swatches in the wiki entry.
 *
 * Keys are character IDs from the Supabase `characters` table (the name
 * with spaces replaced by underscores).
 */

export const STRAW_HAT_COLORS: Record<string, string> = {
  'Monkey_D._Luffy': '#EE1C25', // Red (赤)
  Roronoa_Zoro: '#007A3D', // Green (緑)
  Nami: '#F99B1C', // Orange (オレンジ)
  Usopp: '#FFEB3B', // Yellow (黄色)
  Sanji: '#2E3192', // Blue (青)
  Nefertari_Vivi: '#D0D0D0', // White / Gold (白(金))
  Tony_Tony_Chopper: '#F17BB1', // Pink (ピンク)
  Nico_Robin: '#8B4A8B', // Purple (紫)
  Franky: '#B3DDF2', // Light blue (水色)
  Brook: '#7F7F7F', // White & Black (白・黒) — rendered as mid-gray
  Jinbe: '#C99A60', // Ochre (黄土色)
}

/** Straw-hat emoji used as an inline marker next to SHP names. */
export const STRAW_HAT_MARKER = '\u{1F452}' // 👒

/** Lookup helper — returns undefined for non-SHP characters. */
export function getStrawHatColor(id: string): string | undefined {
  return STRAW_HAT_COLORS[id]
}

/**
 * Perceptual luminance for an RGB hex string. Returns 0 (black) … 1 (white).
 * Accepts #RGB, #RRGGBB, or the hsl() form returned by `wordColor` — for
 * HSL we read the L component directly. Unknown formats default to dark.
 */
export function colorLuminance(color: string): number {
  if (color.startsWith('#')) {
    const h =
      color.length === 4
        ? color
            .slice(1)
            .split('')
            .map((c) => c + c)
            .join('')
        : color.slice(1)
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
  }
  const m = color.match(/hsl\([^,]+,\s*[^,]+,\s*(\d+(?:\.\d+)?)%/i)
  if (m) return parseFloat(m[1]) / 100
  return 0
}

/** True when a colour is bright enough that white text vanishes on it. */
export function isLightColor(color: string): boolean {
  return colorLuminance(color) > 0.62
}
