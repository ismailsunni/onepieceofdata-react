import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { toPng } from 'html-to-image'
import type { ArcQuizAnswer, ArcQuizMode } from '../../types/arcQuiz'
import type { ArcQuizStats } from '../../services/arcQuizStatsService'
import {
  getCharacterImageUrl,
  getScoreRating,
} from '../../services/quizService'
import { ARC_QUIZ_MODES } from '../../services/arcQuizService'
import ArcQuizShareCard, { type ShareFormat } from './ArcQuizShareCard'

interface ArcQuizResultProps {
  answers: ArcQuizAnswer[]
  totalScore: number
  mode: ArcQuizMode
  onPlayAgain: (mode: ArcQuizMode) => void
  isBusy: boolean
  stats: ArcQuizStats
}

function recapSubtitle(answer: ArcQuizAnswer): string {
  if (answer.mode === 'chapter') {
    const base = `Ch. ${answer.character.chapter} · ${answer.correctArc.title}`
    if (answer.selectedChapter === null) return `${base} · Time's up`
    const off = answer.distance ?? 0
    return `${base} · you: ${answer.selectedChapter} (${off === 0 ? 'exact' : `${off} off`}) · +${answer.pointsEarned} pts`
  }
  if (answer.isCorrect)
    return `${answer.correctArc.title} · +${answer.pointsEarned} pts`
  if (answer.selectedArcId === null)
    return `${answer.correctArc.title} · Time's up`
  return `${answer.correctArc.title} · Wrong answer`
}

export default function ArcQuizResult({
  answers,
  totalScore,
  mode,
  onPlayAgain,
  isBusy,
  stats,
}: ArcQuizResultProps) {
  const rating = getScoreRating(totalScore)
  const modeLabel = ARC_QUIZ_MODES.find((m) => m.id === mode)?.label ?? ''
  const [nextMode, setNextMode] = useState<ArcQuizMode>(mode)
  const squareRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const [sharingFormat, setSharingFormat] = useState<ShareFormat | null>(null)
  const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}graph-skull.svg`

  const shareAsImage = async (format: ShareFormat) => {
    const node = format === 'square' ? squareRef.current : storyRef.current
    if (!node) return
    setSharingFormat(format)
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1,
        skipFonts: true,
      })
      const blob = await (await fetch(dataUrl)).blob()
      const fileName = `one-piece-of-data-one-chapter-wonders-${format}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        try {
          await navigator.share({
            files: [file],
            title: 'One Piece of Data — One-Chapter Wonders',
            text: buildShareText(),
          })
          return
        } catch (err) {
          if ((err as DOMException).name === 'AbortError') return
        }
      }

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = fileName
      link.click()
      toast.success('Image downloaded — share it anywhere!')
    } catch (err) {
      console.error(err)
      toast.error('Could not generate share image')
    } finally {
      setSharingFormat(null)
    }
  }

  const buildShareText = () => {
    const resultLines = answers
      .map((a) => {
        const label =
          a.mode === 'chapter'
            ? `Ch. ${a.character.chapter}`
            : a.correctArc.title
        return `${label} ${a.isCorrect ? '✅' : '❌'}`
      })
      .join('\n')

    const gameUrl = 'https://onepieceofdata.com/#/games/one-chapter-wonders'
    return `I reached ${rating.label} with ${totalScore} points in One Piece of Data - One-Chapter Wonders (${modeLabel})!\n${resultLines}\n${gameUrl}`
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

    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        toast.success('Score copied to clipboard!')
        return
      } catch {
        // Fall through to execCommand fallback
      }
    }

    if (copyToClipboardFallback(text)) {
      toast.success('Score copied to clipboard!')
    } else {
      toast.error('Could not share — try copying manually')
    }
  }

  return (
    <div className="flex flex-col items-center w-full pb-32">
      {rating.characterId && (
        <RatingImage characterId={rating.characterId} label={rating.label} />
      )}

      {/* Score display */}
      <div className="text-center mb-2">
        <p className="text-5xl font-bold text-gray-900 mb-2">{totalScore}</p>
        <p className="text-gray-500 text-sm mb-1">out of 5000 · {modeLabel}</p>
        <p className="text-xl font-semibold text-blue-600">{rating.label}</p>
      </div>

      <p className="text-gray-600 mb-6">
        {answers.filter((a) => a.isCorrect).length} / {answers.length} correct
      </p>

      {/* Per-question recap */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {answers.map((answer, i) => (
          <Link
            key={i}
            to={`/arcs/${encodeURIComponent(answer.correctArc.arc_id)}`}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
              answer.isCorrect
                ? 'bg-green-50 border-green-200 hover:border-green-300'
                : 'bg-red-50 border-red-200 hover:border-red-300'
            }`}
          >
            <RecapThumbnail
              characterId={answer.character.id}
              name={answer.character.name}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {answer.character.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {recapSubtitle(answer)}
              </p>
            </div>
            <span className="text-lg flex-shrink-0">
              {answer.isCorrect ? '✅' : '❌'}
            </span>
          </Link>
        ))}
      </div>

      {/* Stats summary */}
      {stats.gamesPlayed > 1 && (
        <div className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {stats.bestScore}
              </p>
              <p className="text-xs text-gray-500">Best Score</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {Math.round(stats.totalScore / stats.gamesPlayed)}
              </p>
              <p className="text-xs text-gray-500">Avg Score</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {Math.round((stats.totalCorrect / stats.totalQuestions) * 100)}%
              </p>
              <p className="text-xs text-gray-500">
                {mode === 'chapter' ? 'Right arc' : 'Accuracy'}
              </p>
            </div>
          </div>
          {totalScore >= stats.bestScore && stats.gamesPlayed > 1 && (
            <p className="text-center text-sm text-green-600 font-medium mt-3">
              New personal best!
            </p>
          )}
        </div>
      )}

      {/* Action buttons - sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-lg mx-auto">
        {rating.nextRank && (
          <p className="text-center text-sm text-gray-500 mb-3">
            {rating.nextThreshold! - totalScore} more points to reach{' '}
            <span className="font-semibold text-gray-700">
              {rating.nextRank}
            </span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => shareAsImage('square')}
            disabled={sharingFormat !== null}
            className="py-2.5 px-3 border-2 border-blue-600 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {sharingFormat === 'square' ? 'Preparing…' : '📷 Share to Feed'}
          </button>
          <button
            onClick={() => shareAsImage('story')}
            disabled={sharingFormat !== null}
            className="py-2.5 px-3 border-2 border-blue-600 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {sharingFormat === 'story' ? 'Preparing…' : '📱 Share to Story'}
          </button>
        </div>
        {/* Mode picker for the next game */}
        <div
          role="group"
          aria-label="Choose mode for next game"
          className="flex bg-gray-100 rounded-xl p-1 mb-2"
        >
          {ARC_QUIZ_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setNextMode(m.id)}
              aria-pressed={nextMode === m.id}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                nextMode === m.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Share as Text
          </button>
          <button
            onClick={() => onPlayAgain(nextMode)}
            disabled={isBusy}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isBusy
              ? 'Loading…'
              : nextMode === mode
                ? 'Play Again'
                : 'Play This Mode'}
          </button>
        </div>
      </div>

      {/* Offscreen share cards */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-99999px',
          left: '-99999px',
          pointerEvents: 'none',
        }}
      >
        <ArcQuizShareCard
          ref={squareRef}
          format="square"
          answers={answers}
          totalScore={totalScore}
          rating={rating.label}
          modeLabel={modeLabel}
          logoUrl={logoUrl}
        />
        <ArcQuizShareCard
          ref={storyRef}
          format="story"
          answers={answers}
          totalScore={totalScore}
          rating={rating.label}
          modeLabel={modeLabel}
          logoUrl={logoUrl}
        />
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
