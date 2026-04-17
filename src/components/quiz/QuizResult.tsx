import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { QuizAnswer } from '../../types/quiz'
import {
  getCharacterImageUrl,
  getShortName,
  getScoreRating,
} from '../../services/quizService'

interface QuizResultProps {
  answers: QuizAnswer[]
  totalScore: number
  onPlayAgain: () => void
}

export default function QuizResult({
  answers,
  totalScore,
  onPlayAgain,
}: QuizResultProps) {
  const rating = getScoreRating(totalScore)

  const buildShareText = () => {
    const resultLines = answers
      .map(
        (a) =>
          `${getShortName(a.correctCharacter.name)} ${a.isCorrect ? '\u2705' : '\u274C'}`
      )
      .join('\n')

    const gameUrl = 'https://onepieceofdata.com/#/games/guess-character'
    return `I reached ${rating.label} with ${totalScore} points in One Piece of Data - Guess the Character!\n${resultLines}\n${gameUrl}`
  }

  const copyToClipboardFallback = (text: string): boolean => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    let success = false
    try {
      success = document.execCommand('copy')
    } catch {
      success = false
    }
    document.body.removeChild(textarea)
    return success
  }

  const handleShare = async () => {
    const text = buildShareText()

    // 1. Try Web Share API (mobile native share sheet)
    if (navigator.share) {
      try {
        await navigator.share({
          text,
        })
        return
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return
        // Fall through to clipboard
      }
    }

    // 2. Try Clipboard API (requires secure context)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        toast.success('Score copied to clipboard!')
        return
      } catch {
        // Fall through to execCommand fallback
      }
    }

    // 3. Fallback: execCommand('copy') — works on HTTP
    if (copyToClipboardFallback(text)) {
      toast.success('Score copied to clipboard!')
    } else {
      toast.error('Could not share — try copying manually')
    }
  }

  return (
    <div className="flex flex-col items-center w-full pb-32">
      {/* Rating image */}
      {rating.characterId && (
        <RatingImage characterId={rating.characterId} label={rating.label} />
      )}

      {/* Score display */}
      <div className="text-center mb-2">
        <p className="text-5xl font-bold text-gray-900 mb-2">{totalScore}</p>
        <p className="text-gray-500 text-sm mb-1">out of 5000</p>
        <p className="text-xl font-semibold text-blue-600">{rating.label}</p>
      </div>

      {/* Correct count */}
      <p className="text-gray-600 mb-6">
        {answers.filter((a) => a.isCorrect).length} / {answers.length} correct
      </p>

      {/* Per-question recap */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {answers.map((answer, i) => (
          <Link
            key={i}
            to={`/characters/${encodeURIComponent(answer.correctCharacter.id)}`}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
              answer.isCorrect
                ? 'bg-green-50 border-green-200 hover:border-green-300'
                : 'bg-red-50 border-red-200 hover:border-red-300'
            }`}
          >
            <RecapThumbnail
              characterId={answer.correctCharacter.id}
              name={answer.correctCharacter.name}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {answer.correctCharacter.name}
              </p>
              <p className="text-xs text-gray-500">
                {answer.isCorrect
                  ? `+${answer.pointsEarned} pts (${answer.timeRemaining.toFixed(1)}s)`
                  : answer.selectedCharacterId === null
                    ? "Time's up"
                    : 'Wrong answer'}
              </p>
            </div>
            <span className="text-lg flex-shrink-0">
              {answer.isCorrect ? '\u2705' : '\u274C'}
            </span>
          </Link>
        ))}
      </div>

      {/* Action buttons - sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 max-w-lg mx-auto">
        <button
          onClick={handleShare}
          className="flex-1 py-3 px-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
        >
          Share Score
        </button>
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}

function RatingImage({
  characterId,
  label,
}: {
  characterId: string
  label: string
}) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = getCharacterImageUrl(characterId)

  if (imgError) return null

  return (
    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-4 ring-4 ring-yellow-400">
      <img
        src={imageUrl}
        alt={label}
        className="w-full h-full object-cover object-top"
        onError={() => setImgError(true)}
      />
    </div>
  )
}

function RecapThumbnail({
  characterId,
  name,
}: {
  characterId: string
  name: string
}) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = getCharacterImageUrl(characterId)

  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {imgError ? (
        <div className="w-full h-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover object-top"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  )
}
