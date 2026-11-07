import { useEffect, useMemo, useState } from 'react'
import type { Character } from '../../types/character'
import {
  scopeSeconds,
  formatClock,
  type RollCallGuess,
  type RollCallScope,
} from '../../services/rollCallService'
import CharacterGuessInput from '../whoami/CharacterGuessInput'

interface RollCallRoundProps {
  scope: RollCallScope
  total: number
  pool: Character[]
  guesses: RollCallGuess[]
  onGuess: (id: string, name: string) => void
  onFinish: (secondsLeft: number) => void
}

export default function RollCallRound({
  scope,
  total,
  pool,
  guesses,
  onGuess,
  onFinish,
}: RollCallRoundProps) {
  const [endsAt] = useState(() => Date.now() + scopeSeconds(scope.type) * 1000)
  const [secondsLeft, setSecondsLeft] = useState(() => scopeSeconds(scope.type))

  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) onFinish(0)
    }, 250)
    return () => clearInterval(timer)
  }, [endsAt, onFinish])

  const guessedIds = useMemo(() => new Set(guesses.map((g) => g.id)), [guesses])
  const options = useMemo(
    () => pool.filter((c) => !guessedIds.has(c.id)),
    [pool, guessedIds]
  )
  const correct = guesses.filter((g) => g.correct)
  const wrong = guesses.filter((g) => !g.correct)
  const lastGuess = guesses[guesses.length - 1]

  useEffect(() => {
    if (correct.length === total) onFinish(secondsLeft)
  }, [correct.length, total, secondsLeft, onFinish])

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-700 truncate pr-2">
          {scope.title}
        </p>
        <p
          className={`text-2xl font-bold tabular-nums ${
            secondsLeft <= 60 ? 'text-red-600' : 'text-gray-900'
          }`}
          aria-label={`${formatClock(secondsLeft)} remaining`}
        >
          {formatClock(secondsLeft)}
        </p>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-blue-600 motion-safe:transition-all"
          style={{ width: `${(correct.length / total) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-sm mb-4">
        <span className="text-gray-700">
          <span className="font-bold text-gray-900">{correct.length}</span> /{' '}
          {total} found
        </span>
        <span className="text-red-600">{wrong.length} wrong</span>
      </div>

      <CharacterGuessInput
        characters={options}
        onGuess={onGuess}
        disabled={false}
        dropDown
      />

      <p className="h-6 mt-2 text-sm text-center" aria-live="polite">
        {lastGuess &&
          (lastGuess.correct ? (
            <span className="text-green-700">✅ {lastGuess.name}</span>
          ) : (
            <span className="text-red-600">
              ❌ {lastGuess.name} isn't in this one
            </span>
          ))}
      </p>

      <GuessList title="Found" guesses={correct} tone="green" />
      <GuessList title="Wrong guesses" guesses={wrong} tone="red" />

      <button
        onClick={() => onFinish(secondsLeft)}
        className="mt-6 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
      >
        Give Up
      </button>
    </div>
  )
}

export function GuessList({
  title,
  guesses,
  tone,
}: {
  title: string
  guesses: { id: string; name: string }[]
  tone: 'green' | 'red' | 'gray'
}) {
  if (guesses.length === 0) return null
  const chip = {
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }[tone]

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
        {title} ({guesses.length})
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {guesses.map((g) => (
          <li
            key={g.id}
            className={`px-2 py-1 text-xs border rounded-lg ${chip}`}
          >
            {g.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
