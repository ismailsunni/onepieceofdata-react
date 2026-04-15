/**
 * Shared sphere-word-cloud primitives: id → color, placement math, projection.
 * Used both by the live-render component (CharacterWordCloudSection) and the
 * offline exporters (wordCloudExport).
 */

export interface WordCloudItem {
  id: string
  name: string
  value: number
  isSHP: boolean
}

export interface SpherePlacement {
  id: string
  name: string
  value: number
  isSHP: boolean
  size: number
  color: string
  /** Unit-sphere base position (before rotation). */
  bx: number
  by: number
  bz: number
}

/** Deterministic hash → stable per-id pseudo-randomness. */
export function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 0xffffffff
}

export const MIN_FONT = 11
export const MAX_FONT = 44

/** Compute sqrt-scaled font size for a value in [min, max]. */
export function wordCloudFontSize(
  value: number,
  min: number,
  max: number
): number {
  if (max <= min) return MIN_FONT
  const t = Math.sqrt(Math.max(0, (value - min) / (max - min)))
  return MIN_FONT + t * (MAX_FONT - MIN_FONT)
}

/**
 * Colour for a word. SHP characters get a fixed high-saturation rose so they
 * pop against the mixed-hue crowd; everyone else gets a pseudo-random hue
 * derived from their id — deterministic per character (stable across renders)
 * but spread across the full colour wheel instead of cycling through a small
 * palette.
 */
export function wordColor(id: string, isSHP: boolean): string {
  if (isSHP) return '#e11d48'
  const hue = Math.floor(hashId(id) * 360)
  const bit = Math.floor(hashId(id + '#') * 1000)
  const sat = 55 + (bit % 20) // 55–74%
  const light = 36 + ((bit >> 3) % 12) // 36–47%
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

/** Fibonacci-sphere layout — evenly distributes N points on the unit sphere. */
export function buildSpherePlacements(
  items: WordCloudItem[],
  minValue: number,
  maxValue: number
): SpherePlacement[] {
  if (items.length === 0) return []
  const sorted = [...items].sort((a, b) => hashId(a.id) - hashId(b.id))
  const n = sorted.length
  const goldenAngle = Math.PI * (1 + Math.sqrt(5))
  return sorted.map((item, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
    const theta = goldenAngle * (i + 0.5)
    return {
      id: item.id,
      name: item.name,
      value: item.value,
      isSHP: item.isSHP,
      size: wordCloudFontSize(item.value, minValue, maxValue),
      color: wordColor(item.id, item.isSHP),
      bx: Math.sin(phi) * Math.cos(theta),
      by: Math.sin(phi) * Math.sin(theta),
      bz: Math.cos(phi),
    }
  })
}

export interface SphereProjection {
  x: number
  y: number
  z: number
  scale: number
  opacity: number
}

/**
 * Project a unit-sphere point through a Y-then-X rotation and scale by radius.
 * Depth (-1..1 on z) drives perspective-style scale + opacity.
 */
export function projectSphere(
  bx: number,
  by: number,
  bz: number,
  rotX: number,
  rotY: number,
  radius: number
): SphereProjection {
  const sinX = Math.sin(rotX)
  const cosX = Math.cos(rotX)
  const sinY = Math.sin(rotY)
  const cosY = Math.cos(rotY)
  const rx = bx * cosY + bz * sinY
  const rz0 = -bx * sinY + bz * cosY
  const ry = by * cosX - rz0 * sinX
  const rz = by * sinX + rz0 * cosX
  const depth = (rz + 1) / 2 // 0 (far) .. 1 (near)
  return {
    x: rx * radius,
    y: ry * radius,
    z: rz,
    scale: 0.35 + 0.75 * depth,
    opacity: 0.2 + 0.8 * depth,
  }
}
