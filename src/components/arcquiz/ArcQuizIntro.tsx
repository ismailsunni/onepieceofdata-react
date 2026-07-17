import type { ArcQuizStats } from '../../services/arcQuizStatsService'
import { ARC_QUIZ_MODES, getModeTime } from '../../services/arcQuizService'
import type { ArcQuizMode } from '../../types/arcQuiz'

interface ArcQuizIntroProps {
  mode: ArcQuizMode
  onSelectMode: (mode: ArcQuizMode) => void
  onStart: () => void
  isLoading: boolean
  stats: ArcQuizStats
}

export default function ArcQuizIntro({
  mode,
  onSelectMode,
  onStart,
  isLoading,
  stats,
}: ArcQuizIntroProps) {
  const hasPlayed = stats.gamesPlayed > 0
  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
      : 0

  const time = getModeTime(mode)
  const guessLine =
    mode === 'options'
      ? 'Pick the arc from 4 options'
      : mode === 'search'
        ? 'Search and pick from every arc'
        : 'Type the chapter — closer earns more points'

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        One-Chapter Wonders
      </h1>
      <p className="text-gray-600 text-lg mb-6 max-w-md">
        These characters appear in just a single chapter. Can you place where
        they showed up?
      </p>

      {/* Mode selector */}
      <div
        role="group"
        aria-label="Choose a mode"
        className="inline-flex bg-gray-100 rounded-xl p-1 mb-2"
      >
        {ARC_QUIZ_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMode(m.id)}
            aria-pressed={mode === m.id}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === m.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {ARC_QUIZ_MODES.find((m) => m.id === mode)?.tagline}
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 max-w-sm w-full text-left space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">01</span>
          <p className="text-gray-700 text-sm">
            5 one-chapter characters, one appearance each
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">02</span>
          <p className="text-gray-700 text-sm">{guessLine}</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">03</span>
          <p className="text-gray-700 text-sm">
            {time} seconds per question
            {mode === 'chapter' ? '' : ' — faster answers earn more points'}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">04</span>
          <p className="text-gray-700 text-sm">
            Max score: 5000 points — can you reach Pirate King?
          </p>
        </div>
      </div>

      {hasPlayed && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 max-w-sm w-full">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-3 tracking-wide">
            Your Stats · {ARC_QUIZ_MODES.find((m) => m.id === mode)?.label}
          </p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.gamesPlayed}
              </p>
              <p className="text-xs text-gray-500">Games</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.bestScore}
              </p>
              <p className="text-xs text-gray-500">Best Score</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{accuracy}%</p>
              <p className="text-xs text-gray-500">
                {mode === 'chapter' ? 'Right arc' : 'Accuracy'}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {stats.bestRank}
              </p>
              <p className="text-xs text-gray-500">Best Rank</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onStart}
        disabled={isLoading}
        className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Loading...
          </span>
        ) : hasPlayed ? (
          'Play Again'
        ) : (
          'Start Game'
        )}
      </button>
    </div>
  )
}
