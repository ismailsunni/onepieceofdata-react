/**
 * Shared sphere-word-cloud primitives: id → color, placement math, projection.
 * Used both by the live-render component (CharacterWordCloudSection) and the
 * offline exporters (wordCloudExport).
 */
import { getStrawHatColor } from '../constants/strawHatColors'

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
 * Colour for a word. Straw Hats get Oda's signature crew colour (red for
 * Luffy, green for Zoro, etc.) so the crew stays visually identifiable
 * across every chart that uses this palette. Unknown SHPs (defensive
 * fallback) keep the previous rose. Everyone else gets a pseudo-random
 * hue derived from their id — deterministic per character (stable across
 * renders) but spread across the full colour wheel instead of cycling
 * through a small palette.
 */
export function wordColor(id: string, isSHP: boolean): string {
  if (isSHP) return getStrawHatColor(id) ?? '#e11d48'
  // Three independent hashes so hue/sat/light don't correlate. Wider S/L
  // ranges than before — the earlier 55–74% / 36–47% bands compressed every
  // character into nearly-identical muted tones. The new bands stay legible
  // against a light background while spanning muted → vivid.
  const hue = Math.floor(hashId(id) * 360)
  const satBit = Math.floor(hashId(id + '#') * 1000)
  const lightBit = Math.floor(hashId(id + '@') * 1000)
  const sat = 55 + (satBit % 40) // 55–94%
  const light = 28 + (lightBit % 24) // 28–51%
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

/** Greatest common divisor — used to build a bijective sphere permutation. */
function gcd(a: number, b: number): number {
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a
}

/**
 * Pick a stride near φ·n that is coprime to n. Used to decorrelate a length-
 * ordered character list from the Fibonacci-sphere index order, so adjacent
 * sorted ranks land on sphere indices that are far apart.
 */
function goldenStride(n: number): number {
  if (n <= 1) return 1
  const target = Math.max(2, Math.round(n * 0.6180339887498949))
  // Walk symmetrically outward from target until we find a value coprime
  // with n. Bounded by n, so guaranteed to terminate (1 and n-1 are always
  // coprime with n for n > 2).
  for (let delta = 0; delta < n; delta++) {
    for (const sign of [1, -1]) {
      const s = target + sign * delta
      if (s > 1 && s < n && gcd(s, n) === 1) return s
    }
  }
  return 1
}

/**
 * Fibonacci-sphere layout — evenly distributes N points on the unit sphere.
 *
 * Placement strategy: sort characters by name length (descending, then by
 * hashId for a stable tie-break) and assign rank `r` to sphere index
 * `(r * stride) mod n`, where `stride` is coprime to n and close to φ·n.
 * This scatters long names across the sphere instead of letting chance
 * cluster them on one side.
 */
export function buildSpherePlacements(
  items: WordCloudItem[],
  minValue: number,
  maxValue: number
): SpherePlacement[] {
  if (items.length === 0) return []
  const n = items.length
  const byLength = [...items].sort(
    (a, b) => b.name.length - a.name.length || hashId(a.id) - hashId(b.id)
  )
  const stride = goldenStride(n)
  const goldenAngle = Math.PI * (1 + Math.sqrt(5))
  const placements = new Array<SpherePlacement>(n)
  for (let r = 0; r < n; r++) {
    const i = (r * stride) % n
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
    const theta = goldenAngle * (i + 0.5)
    const item = byLength[r]
    placements[i] = {
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
  }
  return placements
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
