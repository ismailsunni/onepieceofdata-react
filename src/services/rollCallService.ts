import type { Character } from '../types/character'

export const ROLL_CALL_SECONDS = 10 * 60

export type RollCallScopeType = 'saga' | 'arc'

export interface RollCallScope {
  type: RollCallScopeType
  id: string
  title: string
}

export interface RollCallGuess {
  id: string
  name: string
  correct: boolean
}

export function isGuessable(c: Character): boolean {
  return !!c.name && c.is_likely_character !== false
}

export function charactersInScope(
  characters: Character[],
  scope: RollCallScope
): Character[] {
  return characters.filter(
    (c) =>
      isGuessable(c) &&
      (scope.type === 'saga' ? c.saga_list : c.arc_list)?.includes(scope.id)
  )
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
