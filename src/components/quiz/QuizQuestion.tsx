import { useState, useEffect, useRef } from 'react'
import type { QuizQuestion as QuizQuestionType } from '../../types/quiz'
import { calculatePoints, TIME_PER_QUESTION } from '../../services/quizService'

interface QuizQuestionProps {
  question: QuizQuestionType
  questionIndex: number
  totalQuestions: number
  onAnswer: (
    selectedId: string | null,
    isCorrect: boolean,
    timeRemaining: number,
    points: number
  ) => void
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightName(text: string, name: string): React.ReactNode[] {
  const terms = new Set<string>()
  terms.add(name.trim())
  for (const part of name.split(/\s+/)) {
    const cleaned = part.replace(/[.,;:]$/, '')
    if (cleaned.length >= 3) terms.add(cleaned)
  }
  const pattern = [...terms]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|')
  if (!pattern) return [text]
  const regex = new RegExp(`(${pattern})`, 'gi')
  return text.split(regex).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

export default function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
}: QuizQuestionProps) {
  // Component is remounted via key={currentQuestion} so initial state = reset
  const [timeRemaining, setTimeRemaining] = useState(TIME_PER_QUESTION)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [imgError, setImgError] = useState(false)
  const startTimeRef = useRef(0)
  const answeredRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const pendingResultRef = useRef<{
    selectedId: string | null
    isCorrect: boolean
    timeRemaining: number
    points: number
  } | null>(null)

  // Start timer on mount
  useEffect(() => {
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, TIME_PER_QUESTION - elapsed)
      setTimeRemaining(remaining)

      if (remaining <= 0 && !answeredRef.current) {
        answeredRef.current = true
        clearInterval(timerRef.current)
        setSelectedId(null)
        setShowFeedback(true)
        pendingResultRef.current = {
          selectedId: null,
          isCorrect: false,
          timeRemaining: 0,
          points: 0,
        }
      }
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [])

  const handleSelect = (characterId: string) => {
    if (answeredRef.current) return
    answeredRef.current = true
    clearInterval(timerRef.current)

    const isCorrect = characterId === question.correctCharacter.id
    const points = isCorrect ? calculatePoints(timeRemaining) : 0

    setSelectedId(characterId)
    setShowFeedback(true)
    pendingResultRef.current = {
      selectedId: characterId,
      isCorrect,
      timeRemaining,
      points,
    }
  }

  const handleNext = () => {
    const result = pendingResultRef.current
    if (!result) return
    onAnswer(
      result.selectedId,
      result.isCorrect,
      result.timeRemaining,
      result.points
    )
  }

  const isLastQuestion = questionIndex === totalQuestions - 1

  // Timer bar color
  const timerColor =
    timeRemaining > 5
      ? 'bg-blue-600'
      : timeRemaining > 3
        ? 'bg-yellow-500'
        : 'bg-red-500'

  const timerPercent = (timeRemaining / TIME_PER_QUESTION) * 100

  // Progress dots
  const dots = Array.from({ length: totalQuestions }, (_, i) => i)

  return (
    <div className="flex flex-col items-center w-full">
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-4">
        {dots.map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i < questionIndex
                ? 'bg-blue-600'
                : i === questionIndex
                  ? 'bg-blue-600 ring-2 ring-blue-200'
                  : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Question {questionIndex + 1} of {totalQuestions}
      </p>

      {/* Character image */}
      <div className="w-full max-w-[280px] aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
        {imgError ? (
          <svg
            className="w-24 h-24 text-gray-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ) : (
          <img
            src={question.imageUrl}
            alt="Guess this character"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
            draggable={false}
          />
        )}
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-[280px] h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${timerColor}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Options */}
      {!showFeedback && (
        <div className="w-full max-w-sm space-y-3">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="w-full min-h-[56px] py-4 px-6 rounded-xl text-lg font-medium transition-all duration-200 bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-400 hover:bg-blue-50"
            >
              {option.name}
            </button>
          ))}
        </div>
      )}

      {/* Feedback text */}
      {showFeedback && (
        <div className="mt-4 w-full max-w-sm">
          <div className="text-center">
            {selectedId === null ? (
              <p className="text-red-600 font-medium">
                Time's up! It was {question.correctCharacter.name}
              </p>
            ) : selectedId === question.correctCharacter.id ? (
              <p className="text-green-600 font-medium">
                Correct! +{calculatePoints(timeRemaining)} points
              </p>
            ) : (
              <>
                <p className="text-red-600 font-medium">
                  Wrong! It was {question.correctCharacter.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  You picked:{' '}
                  {question.options.find((o) => o.id === selectedId)?.name}
                </p>
              </>
            )}
          </div>

          {question.correctCharacter.bio && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                About {question.correctCharacter.name}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {highlightName(
                  question.correctCharacter.bio,
                  question.correctCharacter.name
                )}
              </p>
            </div>
          )}

          <button
            onClick={handleNext}
            className="mt-4 w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            {isLastQuestion ? 'See Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  )
}
