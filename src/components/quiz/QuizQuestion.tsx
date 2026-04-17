import { useState, useEffect, useRef } from 'react'
import type { QuizQuestion as QuizQuestionType } from '../../types/quiz'
import { calculatePoints } from '../../services/quizService'

const TIME_PER_QUESTION = 10 // seconds
const PREVIEW_DURATION = 2000 // ms — show options before revealing image
const FEEDBACK_DURATION = 1500 // ms

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

export default function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
}: QuizQuestionProps) {
  // Component is remounted via key={currentQuestion} so initial state = reset
  const [phase, setPhase] = useState<'preview' | 'answering' | 'feedback'>(
    'preview'
  )
  const [timeRemaining, setTimeRemaining] = useState(TIME_PER_QUESTION)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const startTimeRef = useRef(0)
  const answeredRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // Preview phase: show options for 2 seconds, then reveal image and start timer
  useEffect(() => {
    const previewTimer = setTimeout(() => {
      startTimeRef.current = Date.now()
      setPhase('answering')
    }, PREVIEW_DURATION)

    return () => clearTimeout(previewTimer)
  }, [])

  // Timer logic — only runs during answering phase
  useEffect(() => {
    if (phase !== 'answering') return

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, TIME_PER_QUESTION - elapsed)
      setTimeRemaining(remaining)

      if (remaining <= 0 && !answeredRef.current) {
        answeredRef.current = true
        clearInterval(timerRef.current)
        setSelectedId(null)
        setPhase('feedback')
        setTimeout(() => {
          onAnswer(null, false, 0, 0)
        }, FEEDBACK_DURATION)
      }
    }, 50)

    return () => clearInterval(timerRef.current)
  }, [phase, onAnswer])

  const handleSelect = (characterId: string) => {
    if (phase !== 'answering' || answeredRef.current) return
    answeredRef.current = true
    clearInterval(timerRef.current)

    const isCorrect = characterId === question.correctCharacter.id
    const points = isCorrect ? calculatePoints(timeRemaining) : 0

    setSelectedId(characterId)
    setPhase('feedback')

    const capturedRemaining = timeRemaining
    setTimeout(() => {
      onAnswer(characterId, isCorrect, capturedRemaining, points)
    }, FEEDBACK_DURATION)
  }

  const showFeedback = phase === 'feedback'
  const showImage = phase === 'answering' || phase === 'feedback'

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

      {/* Character image — hidden during preview */}
      <div className="w-full max-w-[280px] aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
        {!showImage ? (
          <p className="text-gray-400 font-medium text-lg">Get ready...</p>
        ) : imgError ? (
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

      {/* Timer bar — only active during answering */}
      <div className="w-full max-w-[280px] h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        {showImage && (
          <div
            className={`h-full rounded-full transition-all duration-100 ${timerColor}`}
            style={{ width: `${timerPercent}%` }}
          />
        )}
      </div>

      {/* Options — always visible */}
      <div className="w-full max-w-sm space-y-3">
        {question.options.map((option) => {
          let buttonStyle =
            'bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-400 hover:bg-blue-50'

          if (phase === 'preview') {
            buttonStyle =
              'bg-white border-2 border-gray-200 text-gray-900 cursor-default'
          } else if (showFeedback) {
            if (option.id === question.correctCharacter.id) {
              buttonStyle =
                'bg-green-50 border-2 border-green-500 text-green-900'
            } else if (
              option.id === selectedId &&
              option.id !== question.correctCharacter.id
            ) {
              buttonStyle = 'bg-red-50 border-2 border-red-500 text-red-900'
            } else {
              buttonStyle =
                'bg-white border-2 border-gray-200 text-gray-400 cursor-default'
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={phase !== 'answering'}
              className={`w-full min-h-[56px] py-4 px-6 rounded-xl text-lg font-medium transition-all duration-200 ${buttonStyle} disabled:cursor-default`}
            >
              {option.name}
            </button>
          )
        })}
      </div>

      {/* Feedback text */}
      {showFeedback && (
        <div className="mt-4 text-center">
          {selectedId === null ? (
            <p className="text-red-600 font-medium">
              Time's up! It was {question.correctCharacter.name}
            </p>
          ) : selectedId === question.correctCharacter.id ? (
            <p className="text-green-600 font-medium">
              Correct! +{calculatePoints(timeRemaining)} points
            </p>
          ) : (
            <p className="text-red-600 font-medium">
              Wrong! It was {question.correctCharacter.name}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
