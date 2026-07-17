import { useState, useEffect, useRef, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import type {
  ArcOption,
  ArcQuizMode,
  ArcQuizQuestion as ArcQuizQuestionType,
} from '../../types/arcQuiz'
import {
  chapterPoints,
  getModeTime,
  speedPoints,
} from '../../services/arcQuizService'
import ArcSearchInput from './ArcSearchInput'

export interface ArcQuizResult {
  selectedArcId: string | null
  selectedChapter: number | null
  isCorrect: boolean
  distance: number | null
  timeRemaining: number
  points: number
}

interface ArcQuizQuestionProps {
  question: ArcQuizQuestionType
  questionIndex: number
  totalQuestions: number
  mode: ArcQuizMode
  allArcs: ArcOption[]
  onAnswer: (result: ArcQuizResult) => void
}

export default function ArcQuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  mode,
  allArcs,
  onAnswer,
}: ArcQuizQuestionProps) {
  const maxTime = getModeTime(mode)
  // Component is remounted via key={currentQuestion} so initial state = reset
  const [timeRemaining, setTimeRemaining] = useState(maxTime)
  const [showFeedback, setShowFeedback] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [chapterInput, setChapterInput] = useState('')
  const startTimeRef = useRef(0)
  const answeredRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const chapterInputRef = useRef(chapterInput)
  const timeRef = useRef(maxTime)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const resultRef = useRef<ArcQuizResult | null>(null)

  chapterInputRef.current = chapterInput
  timeRef.current = timeRemaining

  const arcTitle = useMemo(() => {
    const map = new Map(allArcs.map((a) => [a.arc_id, a.title]))
    return (id: string | null) => (id ? (map.get(id) ?? id) : null)
  }, [allArcs])

  const finalize = (result: ArcQuizResult) => {
    if (answeredRef.current) return
    answeredRef.current = true
    clearInterval(timerRef.current)
    resultRef.current = result
    setShowFeedback(true)
  }

  const answerArc = (arcId: string) => {
    const isCorrect = arcId === question.correctArc.arc_id
    finalize({
      selectedArcId: arcId,
      selectedChapter: null,
      isCorrect,
      distance: null,
      timeRemaining: timeRef.current,
      points: isCorrect ? speedPoints(timeRef.current, maxTime) : 0,
    })
  }

  const answerChapter = () => {
    const guess = parseInt(chapterInputRef.current, 10)
    if (Number.isNaN(guess)) return
    const distance = Math.abs(guess - question.character.chapter)
    const isCorrect =
      guess >= question.correctArcStart && guess <= question.correctArcEnd
    finalize({
      selectedArcId: null,
      selectedChapter: guess,
      isCorrect,
      distance,
      timeRemaining: timeRef.current,
      points: chapterPoints(distance),
    })
  }

  // Start timer on mount
  useEffect(() => {
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const remaining = Math.max(0, maxTime - elapsed)
      setTimeRemaining(remaining)

      if (remaining <= 0 && !answeredRef.current) {
        // Time up: submit chapter guess if entered, otherwise a blank miss
        if (mode === 'chapter') {
          const guess = parseInt(chapterInputRef.current, 10)
          if (!Number.isNaN(guess)) {
            const distance = Math.abs(guess - question.character.chapter)
            finalize({
              selectedArcId: null,
              selectedChapter: guess,
              isCorrect:
                guess >= question.correctArcStart &&
                guess <= question.correctArcEnd,
              distance,
              timeRemaining: 0,
              points: chapterPoints(distance),
            })
            return
          }
        }
        finalize({
          selectedArcId: null,
          selectedChapter: null,
          isCorrect: false,
          distance: null,
          timeRemaining: 0,
          points: 0,
        })
      }
    }, 50)

    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showFeedback) nextButtonRef.current?.focus()
  }, [showFeedback])

  const handleNext = () => {
    if (resultRef.current) onAnswer(resultRef.current)
  }

  const isLastQuestion = questionIndex === totalQuestions - 1
  const result = resultRef.current

  const timerColor =
    timeRemaining > maxTime * 0.5
      ? 'bg-blue-600'
      : timeRemaining > maxTime * 0.3
        ? 'bg-yellow-500'
        : 'bg-red-500'
  const timerPercent = (timeRemaining / maxTime) * 100
  const dots = Array.from({ length: totalQuestions }, (_, i) => i)

  const promptText =
    mode === 'chapter'
      ? 'In which chapter did this character appear?'
      : 'In which arc did this character appear?'

  return (
    <div className="flex flex-col items-center w-full">
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-4" aria-hidden="true">
        {dots.map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full motion-safe:transition-colors ${
              i < questionIndex
                ? 'bg-blue-600'
                : i === questionIndex
                  ? 'bg-blue-600 ring-2 ring-blue-200'
                  : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-600 mb-4" aria-live="polite">
        Question {questionIndex + 1} of {totalQuestions}
      </p>

      {/* Character image */}
      <div className="w-full max-w-[220px] aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3 flex items-center justify-center">
        {imgError ? (
          <svg
            role="img"
            aria-label="Character portrait unavailable"
            className="w-24 h-24 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ) : (
          <img
            src={question.imageUrl}
            alt={question.character.name}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
            draggable={false}
          />
        )}
      </div>

      {/* Character name + prompt */}
      <p className="text-xl font-bold text-gray-900 text-center">
        {question.character.name}
      </p>
      <p className="text-sm text-gray-600 mb-4 text-center">{promptText}</p>

      {/* Timer bar */}
      <div
        role="timer"
        aria-label={`Time remaining: ${Math.ceil(timeRemaining)} seconds`}
        className="w-full max-w-sm h-2 bg-gray-200 rounded-full mb-6 overflow-hidden"
      >
        <div
          aria-hidden="true"
          className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-100 ${timerColor}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {Math.ceil(timeRemaining) <= 3
          ? `${Math.ceil(timeRemaining)} seconds left`
          : Math.ceil(timeRemaining) % 5 === 0
            ? `${Math.ceil(timeRemaining)} seconds left`
            : ''}
      </span>

      {/* Input area */}
      {!showFeedback && mode === 'options' && (
        <div
          role="group"
          aria-label="Answer choices"
          className="w-full max-w-sm grid grid-cols-1 gap-3"
        >
          {question.options.map((option) => (
            <button
              key={option.arc_id}
              type="button"
              onClick={() => answerArc(option.arc_id)}
              className="min-h-[56px] py-3 px-4 rounded-xl text-base font-medium motion-safe:transition-all motion-safe:duration-200 bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            >
              {option.title}
            </button>
          ))}
        </div>
      )}

      {!showFeedback && mode === 'search' && (
        <ArcSearchInput arcs={allArcs} onGuess={answerArc} disabled={false} />
      )}

      {!showFeedback && mode === 'chapter' && (
        <form
          className="w-full max-w-sm flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            answerChapter()
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            aria-label="Guess the chapter number"
            value={chapterInput}
            onChange={(e) => setChapterInput(e.target.value)}
            placeholder="Chapter number…"
            autoFocus
            className="flex-1 min-w-0 px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={chapterInput.trim() === ''}
            className="px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guess
          </button>
        </form>
      )}

      {/* Feedback */}
      {showFeedback && result && (
        <div className="mt-2 w-full max-w-sm">
          <div role="status" aria-live="polite" className="text-center">
            {mode === 'chapter' ? (
              <ChapterFeedback
                result={result}
                chapter={question.character.chapter}
                arcTitle={question.correctArc.title}
              />
            ) : result.selectedArcId === null ? (
              <p className="text-red-700 font-medium inline-flex items-center gap-2 justify-center">
                <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                <span className="sr-only">Incorrect. </span>
                Time's up! It was{' '}
                <span className="font-bold">{question.correctArc.title}</span>
              </p>
            ) : result.isCorrect ? (
              <p className="text-green-700 font-medium inline-flex items-center gap-2 justify-center">
                <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                <span className="sr-only">Correct. </span>
                Correct! +{result.points} points
              </p>
            ) : (
              <>
                <p className="text-red-700 font-medium inline-flex items-center gap-2 justify-center">
                  <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                  <span className="sr-only">Incorrect. </span>
                  Wrong! It was{' '}
                  <span className="font-bold">{question.correctArc.title}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  You picked: {arcTitle(result.selectedArcId)}
                </p>
              </>
            )}
          </div>

          {mode !== 'chapter' && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Appears only in chapter {question.character.chapter}
            </p>
          )}

          {question.character.bio && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                About {question.character.name}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {question.character.bio}
              </p>
            </div>
          )}

          <button
            ref={nextButtonRef}
            type="button"
            onClick={handleNext}
            className="mt-4 w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {isLastQuestion ? 'See Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  )
}

function ChapterFeedback({
  result,
  chapter,
  arcTitle,
}: {
  result: ArcQuizResult
  chapter: number
  arcTitle: string
}) {
  if (result.selectedChapter === null) {
    return (
      <p className="text-red-700 font-medium inline-flex items-center gap-2 justify-center">
        <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        <span className="sr-only">Incorrect. </span>
        Time's up! It was chapter <span className="font-bold">{chapter}</span> (
        {arcTitle})
      </p>
    )
  }
  const off = result.distance ?? 0
  const color = result.isCorrect ? 'text-green-700' : 'text-gray-700'
  return (
    <div>
      <p className={`font-medium ${color}`}>
        {result.isCorrect ? 'Right arc! ' : ''}It was chapter{' '}
        <span className="font-bold">{chapter}</span> ({arcTitle})
      </p>
      <p className="text-sm text-gray-600 mt-1">
        You guessed {result.selectedChapter} —{' '}
        {off === 0 ? 'spot on!' : `${off} chapter${off === 1 ? '' : 's'} off`} ·
        +{result.points} points
      </p>
    </div>
  )
}
