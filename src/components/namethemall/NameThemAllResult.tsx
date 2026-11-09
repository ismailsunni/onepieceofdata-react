import { useRef, useState } from 'react'
import type { Character } from '../../types/character'
import {
  scopeSeconds,
  formatClock,
  type NameThemAllGuess,
  type NameThemAllScope,
} from '../../services/nameThemAllService'
import { shareImage, shareText } from '../../utils/shareGame'
import { GuessList } from './NameThemAllRound'
import NameThemAllShareCard, { type ShareFormat } from './NameThemAllShareCard'

interface NameThemAllResultProps {
  scope: NameThemAllScope
  targets: Character[]
  guesses: NameThemAllGuess[]
  secondsLeft: number
  onPlayAgain: () => void
  onChangeScope: () => void
}

export default function NameThemAllResult({
  scope,
  targets,
  guesses,
  secondsLeft,
  onPlayAgain,
  onChangeScope,
}: NameThemAllResultProps) {
  const squareRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState<ShareFormat | null>(null)
  const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}graph-skull.svg`

  const correct = guesses.filter((g) => g.correct)
  const wrong = guesses.filter((g) => !g.correct)
  const foundIds = new Set(correct.map((g) => g.id))
  const missed = targets
    .filter((c) => !foundIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name! }))
  const total = targets.length
  const pct = total ? Math.round((correct.length / total) * 100) : 0
  const timeUsed = formatClock(scopeSeconds(scope.type) - secondsLeft)

  const text = `I named ${correct.length} / ${total} characters (${pct}%) from ${scope.title} in One Piece of Data - Name Them All! ❌ ${wrong.length} wrong · ⏱ ${timeUsed}\nhttps://onepieceofdata.com/#/games/name-them-all`

  const handleShareImage = async (format: ShareFormat) => {
    const node = format === 'square' ? squareRef.current : storyRef.current
    if (!node) return
    setSharing(format)
    await shareImage(
      node,
      `one-piece-of-data-name-them-all-${format}.png`,
      'One Piece of Data — Name Them All',
      text
    )
    setSharing(null)
  }

  return (
    <div className="flex flex-col items-center w-full pb-48">
      <p className="text-sm font-semibold text-gray-600 mb-2">{scope.title}</p>
      <p className="text-5xl font-bold text-gray-900">
        {correct.length}
        <span className="text-2xl text-gray-500"> / {total}</span>
      </p>
      <p className="text-gray-600 mt-1">characters named · {pct}%</p>
      <div className="flex gap-6 mt-4 text-sm">
        <span className="text-red-600 font-semibold">
          {wrong.length} wrong {wrong.length === 1 ? 'guess' : 'guesses'}
        </span>
        <span className="text-gray-600">⏱ {timeUsed}</span>
      </div>

      <div className="w-full">
        <GuessList title="Found" guesses={correct} tone="green" />
        <GuessList title="Wrong guesses" guesses={wrong} tone="red" />
        <GuessList title="Missed" guesses={missed} tone="gray" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-2 mb-2">
          {(['square', 'story'] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleShareImage(f)}
              disabled={sharing !== null}
              className="py-2.5 px-3 border-2 border-blue-600 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              {sharing === f
                ? 'Preparing…'
                : f === 'square'
                  ? '📷 Share to Feed'
                  : '📱 Share to Story'}
            </button>
          ))}
        </div>
        <button
          onClick={() => shareText(text)}
          className="w-full mb-2 py-2.5 px-4 border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Share as Text
        </button>
        <div className="flex gap-3">
          <button
            onClick={onChangeScope}
            className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Change Round
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-99999px',
          left: '-99999px',
          pointerEvents: 'none',
        }}
      >
        {(['square', 'story'] as const).map((f) => (
          <NameThemAllShareCard
            key={f}
            ref={f === 'square' ? squareRef : storyRef}
            format={f}
            scopeTitle={scope.title}
            correct={correct.length}
            total={total}
            wrong={wrong.length}
            timeUsed={timeUsed}
            logoUrl={logoUrl}
          />
        ))}
      </div>
    </div>
  )
}
