import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import { fetchArcs } from '../services/arcService'
import { generateArcQuizQuestions } from '../services/arcQuizService'
import { getScoreRating } from '../services/quizService'
import {
  loadArcQuizStats,
  saveArcQuizResult,
  type ArcQuizStats,
} from '../services/arcQuizStatsService'
import { CACHE } from '../constants/cache'
import type {
  ArcOption,
  ArcQuizMode,
  ArcQuizQuestion,
  ArcQuizAnswer,
} from '../types/arcQuiz'
import ArcQuizIntro from '../components/arcquiz/ArcQuizIntro'
import ArcQuizQuestionComponent, {
  type ArcQuizResult as QuestionResult,
} from '../components/arcquiz/ArcQuizQuestion'
import ArcQuizResult from '../components/arcquiz/ArcQuizResult'
import ErrorState from '../components/common/ErrorState'

type Phase = 'intro' | 'playing' | 'result'

export default function ArcQuizPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [mode, setMode] = useState<ArcQuizMode>('options')
  const [playedMode, setPlayedMode] = useState<ArcQuizMode>('options')
  const [questions, setQuestions] = useState<ArcQuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<ArcQuizAnswer[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [stats, setStats] = useState<ArcQuizStats>(() =>
    loadArcQuizStats('options')
  )

  const {
    data: characters,
    isLoading: isLoadingCharacters,
    isError: isCharactersError,
    refetch: refetchCharacters,
  } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: CACHE.DEFAULT_STALE,
  })

  const { data: arcs, isLoading: isLoadingArcs } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
    staleTime: CACHE.DEFAULT_STALE,
  })

  const allArcs: ArcOption[] = useMemo(
    () =>
      (arcs ?? [])
        .map((a) => ({ arc_id: a.arc_id, title: a.title }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [arcs]
  )

  const handleSelectMode = useCallback((next: ArcQuizMode) => {
    setMode(next)
    setStats(loadArcQuizStats(next))
  }, [])

  const beginGame = useCallback(
    async (selectedMode: ArcQuizMode) => {
      if (!characters || characters.length === 0 || !arcs || arcs.length === 0)
        return

      setIsGenerating(true)
      const generated = await generateArcQuizQuestions(characters, arcs)
      setIsGenerating(false)

      if (!generated) return

      setQuestions(generated)
      setAnswers([])
      setTotalScore(0)
      setCurrentQuestion(0)
      setMode(selectedMode)
      setPlayedMode(selectedMode)
      setPhase('playing')
    },
    [characters, arcs]
  )

  const startQuiz = useCallback(() => beginGame(mode), [beginGame, mode])

  const handleAnswer = useCallback(
    (result: QuestionResult) => {
      const question = questions[currentQuestion]
      const answer: ArcQuizAnswer = {
        questionIndex: currentQuestion,
        character: question.character,
        correctArc: question.correctArc,
        mode: playedMode,
        selectedArcId: result.selectedArcId,
        selectedChapter: result.selectedChapter,
        isCorrect: result.isCorrect,
        distance: result.distance,
        timeRemaining: result.timeRemaining,
        pointsEarned: result.points,
      }

      const newAnswers = [...answers, answer]
      const newScore = totalScore + result.points

      setAnswers(newAnswers)
      setTotalScore(newScore)

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      } else {
        const correctCount = newAnswers.filter((a) => a.isCorrect).length
        const rating = getScoreRating(newScore)
        const updated = saveArcQuizResult(
          playedMode,
          newScore,
          rating.label,
          correctCount,
          newAnswers.length
        )
        setStats(updated)
        setPhase('result')
      }
    },
    [currentQuestion, questions, answers, totalScore, playedMode]
  )

  const handlePlayAgain = useCallback(
    (nextMode: ArcQuizMode) => beginGame(nextMode),
    [beginGame]
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {isCharactersError ? (
        <ErrorState
          message="Failed to load characters. Please try again."
          onRetry={() => refetchCharacters()}
        />
      ) : null}

      {!isCharactersError && phase === 'intro' && (
        <ArcQuizIntro
          mode={mode}
          onSelectMode={handleSelectMode}
          onStart={startQuiz}
          isLoading={isLoadingCharacters || isLoadingArcs || isGenerating}
          stats={stats}
        />
      )}

      {phase === 'playing' && questions[currentQuestion] && (
        <ArcQuizQuestionComponent
          key={currentQuestion}
          question={questions[currentQuestion]}
          questionIndex={currentQuestion}
          totalQuestions={questions.length}
          mode={playedMode}
          allArcs={allArcs}
          onAnswer={handleAnswer}
        />
      )}

      {phase === 'result' && (
        <ArcQuizResult
          answers={answers}
          totalScore={totalScore}
          mode={playedMode}
          onPlayAgain={handlePlayAgain}
          isBusy={isGenerating}
          stats={stats}
        />
      )}
    </div>
  )
}
