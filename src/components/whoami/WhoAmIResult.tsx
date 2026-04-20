import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { toPng } from 'html-to-image'
import type { WhoAmIRoundResult } from '../../types/whoAmI'
import type { WhoAmIStats } from '../../services/whoAmIStatsService'
import { getWhoAmIRating } from '../../services/whoAmIService'
import { getCharacterImageUrl, getShortName } from '../../services/quizService'
import WhoAmIShareCard, { type ShareFormat } from './WhoAmIShareCard'

interface WhoAmIResultProps {
  roundResults: WhoAmIRoundResult[]
  totalScore: number
  onPlayAgain: () => void
  stats: WhoAmIStats
}

export default function WhoAmIResult({
  roundResults,
  totalScore,
  onPlayAgain,
  stats,
}: WhoAmIResultProps) {
  const rating = getWhoAmIRating(totalScore)
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
      const fileName = `one-piece-of-data-who-am-i-${format}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        try {
          await navigator.share({
            files: [file],
            title: 'One Piece of Data — Who Am I?',
            text: buildShareText(),
          })
          return
        } catch (err) {
          if ((err as DOMException).name === 'AbortError') return
        }
      }

      // Fallback: download
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
    const resultLines = roundResults
      .map((r) => {
        const name = getShortName(r.character.name)
        if (r.guessedCorrectly) {
          return `${name} \u2705 (Hint ${r.hintsUsed})`
        }
        return `${name} \u274C`
      })
      .join('\n')

    const gameUrl = 'https://onepieceofdata.com/#/games/who-am-i'
    return `I reached ${rating.label} with ${totalScore} points in One Piece of Data - Who Am I?\n${resultLines}\n${gameUrl}`
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
        // Fall through
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
      {/* Score display */}
      <div className="text-center mb-2">
        <p className="text-5xl font-bold text-gray-900 mb-2">{totalScore}</p>
        <p className="text-gray-500 text-sm mb-1">out of 15</p>
        <p className="text-xl font-semibold text-blue-600">{rating.label}</p>
      </div>

      {/* Correct count */}
      <p className="text-gray-600 mb-6">
        {roundResults.filter((r) => r.guessedCorrectly).length} /{' '}
        {roundResults.length} correct
      </p>

      {/* Per-round recap */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {roundResults.map((result, i) => (
          <Link
            key={i}
            to={`/characters/${encodeURIComponent(result.character.id)}`}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
              result.guessedCorrectly
                ? 'bg-green-50 border-green-200 hover:border-green-300'
                : 'bg-red-50 border-red-200 hover:border-red-300'
            }`}
          >
            <RecapThumbnail
              characterId={result.character.id}
              name={result.character.name}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {result.character.name}
              </p>
              <p className="text-xs text-gray-500">
                {result.guessedCorrectly
                  ? `+${result.pointsEarned} pts (Hint ${result.hintsUsed})`
                  : result.guessedName
                    ? `Guessed: ${result.guessedName}`
                    : 'Gave up'}
              </p>
            </div>
            <span className="text-lg flex-shrink-0">
              {result.guessedCorrectly ? '\u2705' : '\u274C'}
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
                {Math.round((stats.totalCorrect / stats.totalRounds) * 100)}%
              </p>
              <p className="text-xs text-gray-500">Accuracy</p>
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
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Share as Text
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>

      {/* Offscreen share cards (rendered for html-to-image) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-99999px',
          left: '-99999px',
          pointerEvents: 'none',
        }}
      >
        <WhoAmIShareCard
          ref={squareRef}
          format="square"
          roundResults={roundResults}
          totalScore={totalScore}
          rating={rating.label}
          logoUrl={logoUrl}
        />
        <WhoAmIShareCard
          ref={storyRef}
          format="story"
          roundResults={roundResults}
          totalScore={totalScore}
          rating={rating.label}
          logoUrl={logoUrl}
        />
      </div>
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
