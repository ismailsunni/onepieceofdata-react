import { useState } from 'react'
import type { Character } from '../../types/character'
import type { WhoAmICharacter, WhoAmIRoundResult } from '../../types/whoAmI'
import { calculateWhoAmIPoints } from '../../services/whoAmIService'
import CharacterGuessInput from './CharacterGuessInput'

interface WhoAmIRoundProps {
  character: WhoAmICharacter
  roundIndex: number
  totalRounds: number
  allCharacters: Character[]
  onRoundComplete: (result: WhoAmIRoundResult) => void
}

const MAX_WRONG_PER_HINT = 3

export default function WhoAmIRound({
  character,
  roundIndex,
  totalRounds,
  allCharacters,
  onRoundComplete,
}: WhoAmIRoundProps) {
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [roundComplete, setRoundComplete] = useState(false)
  const [guessedCorrectly, setGuessedCorrectly] = useState(false)
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([])
  const [wrongFeedback, setWrongFeedback] = useState(false)

  const isLastHint = currentHintIndex >= character.hints.length - 1

  const handleGuess = (characterId: string, characterName: string) => {
    if (roundComplete) return

    if (characterId === character.id) {
      // Correct!
      const points = calculateWhoAmIPoints(currentHintIndex)
      setGuessedCorrectly(true)
      setRoundComplete(true)
      onRoundComplete({
        character,
        guessedCorrectly: true,
        hintsUsed: currentHintIndex + 1,
        pointsEarned: points,
        guessedName: characterName,
      })
    } else {
      // Wrong
      setWrongGuesses((prev) => [...prev, characterName])
      const newWrongCount = wrongCount + 1
      setWrongCount(newWrongCount)
      setWrongFeedback(true)
      setTimeout(() => setWrongFeedback(false), 1500)

      if (newWrongCount >= MAX_WRONG_PER_HINT && !isLastHint) {
        // Auto-advance to next hint
        setTimeout(() => {
          setCurrentHintIndex((prev) => prev + 1)
          setWrongCount(0)
        }, 1500)
      } else if (newWrongCount >= MAX_WRONG_PER_HINT && isLastHint) {
        // All wrong on last hint — game over for this round
        setTimeout(() => {
          setRoundComplete(true)
          onRoundComplete({
            character,
            guessedCorrectly: false,
            hintsUsed: character.hints.length,
            pointsEarned: 0,
            guessedName: characterName,
          })
        }, 1500)
      }
    }
  }

  const handleNextHint = () => {
    if (isLastHint || roundComplete) return
    setCurrentHintIndex((prev) => prev + 1)
    setWrongCount(0)
  }

  const handleGiveUp = () => {
    setRoundComplete(true)
    onRoundComplete({
      character,
      guessedCorrectly: false,
      hintsUsed: character.hints.length,
      pointsEarned: 0,
      guessedName: null,
    })
  }

  const visibleHints = character.hints.slice(0, currentHintIndex + 1)
  const potentialPoints = calculateWhoAmIPoints(currentHintIndex)

  return (
    <div className="flex flex-col w-full pb-40">
      {/* Progress */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">
          Round {roundIndex + 1} of {totalRounds}
        </p>
        {!roundComplete && (
          <p className="text-xs text-blue-600 mt-1">
            Current hint value: {potentialPoints}{' '}
            {potentialPoints === 1 ? 'point' : 'points'}
          </p>
        )}
      </div>

      {/* Hint dots */}
      <div className="flex justify-center gap-2 mb-6">
        {character.hints.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i <= currentHintIndex ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Hints */}
      <div className="space-y-3 mb-6">
        {visibleHints.map((hint, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-4 animate-[fadeIn_0.3s_ease-in]"
          >
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
              Hint {i + 1}: {hint.label}
            </p>
            {hint.type === 'text' ? (
              <p className="text-gray-800 text-sm">{hint.value}</p>
            ) : (
              <div className="flex justify-center mt-2">
                <div className="w-48 h-48 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={hint.value}
                    alt="Mystery character"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Round complete feedback */}
      {roundComplete && (
        <div
          className={`text-center p-4 rounded-xl mb-6 ${
            guessedCorrectly
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {guessedCorrectly ? (
            <>
              <p className="text-green-700 font-semibold text-lg">Correct!</p>
              <p className="text-green-600 text-sm mt-1">
                +{calculateWhoAmIPoints(currentHintIndex)} points (guessed on
                hint {currentHintIndex + 1})
              </p>
            </>
          ) : (
            <>
              <p className="text-red-700 font-semibold text-lg">
                The answer was {character.name}
              </p>
              <p className="text-red-600 text-sm mt-1">0 points</p>
            </>
          )}
        </div>
      )}

      {/* Wrong guesses list */}
      {wrongGuesses.length > 0 && !roundComplete && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Wrong guesses
          </p>
          <div className="flex flex-wrap gap-2">
            {wrongGuesses.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              >
                <span className="text-red-400">{'\u2717'}</span>
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Wrong guess feedback toast */}
      {wrongFeedback && !roundComplete && (
        <div className="text-center mb-4">
          <p className="text-red-600 text-sm font-medium animate-pulse">
            Wrong!
            {wrongCount < MAX_WRONG_PER_HINT &&
              ` (${MAX_WRONG_PER_HINT - wrongCount} ${MAX_WRONG_PER_HINT - wrongCount === 1 ? 'try' : 'tries'} left on this hint)`}
          </p>
        </div>
      )}

      {/* Input + action buttons — sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-lg mx-auto">
        {!roundComplete && (
          <>
            <CharacterGuessInput
              characters={allCharacters}
              onGuess={handleGuess}
              disabled={roundComplete}
            />
            <div className="flex gap-3 mt-3">
              {!isLastHint && (
                <button
                  onClick={handleNextHint}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Next Hint
                </button>
              )}
              {isLastHint && (
                <button
                  onClick={handleGiveUp}
                  className="flex-1 py-2.5 px-4 border border-red-300 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
                >
                  Give Up
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
