import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import { generateQuizQuestions } from '../services/quizService'
import { CACHE } from '../constants/cache'
import type { QuizQuestion, QuizAnswer } from '../types/quiz'
import QuizIntro from '../components/quiz/QuizIntro'
import QuizQuestionComponent from '../components/quiz/QuizQuestion'
import QuizResult from '../components/quiz/QuizResult'

type Phase = 'intro' | 'playing' | 'result'

export default function CharacterQuizPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: characters, isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
    staleTime: CACHE.DEFAULT_STALE,
  })

  const startQuiz = useCallback(async () => {
    if (!characters || characters.length === 0) return

    setIsGenerating(true)
    const generated = await generateQuizQuestions(characters)
    setIsGenerating(false)

    if (!generated) {
      // Not enough characters or images — shouldn't happen with real data
      return
    }

    setQuestions(generated)
    setAnswers([])
    setTotalScore(0)
    setCurrentQuestion(0)
    setPhase('playing')
  }, [characters])

  const handleAnswer = useCallback(
    (
      selectedId: string | null,
      isCorrect: boolean,
      timeRemaining: number,
      points: number
    ) => {
      const answer: QuizAnswer = {
        questionIndex: currentQuestion,
        selectedCharacterId: selectedId,
        correctCharacter: questions[currentQuestion].correctCharacter,
        isCorrect,
        timeRemaining,
        pointsEarned: points,
      }

      setAnswers((prev) => [...prev, answer])
      setTotalScore((prev) => prev + points)

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
      } else {
        setPhase('result')
      }
    },
    [currentQuestion, questions]
  )

  const handlePlayAgain = useCallback(() => {
    setPhase('intro')
    setQuestions([])
    setAnswers([])
    setTotalScore(0)
    setCurrentQuestion(0)
  }, [])

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {phase === 'intro' && (
        <QuizIntro
          onStart={startQuiz}
          isLoading={isLoadingCharacters || isGenerating}
        />
      )}

      {phase === 'playing' && questions[currentQuestion] && (
        <QuizQuestionComponent
          key={currentQuestion}
          question={questions[currentQuestion]}
          questionIndex={currentQuestion}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      )}

      {phase === 'result' && (
        <QuizResult
          answers={answers}
          totalScore={totalScore}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
