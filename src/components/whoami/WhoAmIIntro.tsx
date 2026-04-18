import type { WhoAmIStats } from '../../services/whoAmIStatsService'

interface WhoAmIIntroProps {
  onStart: () => void
  isLoading: boolean
  stats: WhoAmIStats
}

export default function WhoAmIIntro({
  onStart,
  isLoading,
  stats,
}: WhoAmIIntroProps) {
  const hasPlayed = stats.gamesPlayed > 0
  const accuracy =
    stats.totalRounds > 0
      ? Math.round((stats.totalCorrect / stats.totalRounds) * 100)
      : 0

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        Who Am I?
      </h1>
      <p className="text-gray-600 text-lg mb-8 max-w-md">
        Guess the One Piece character from progressive hints. Fewer hints = more
        points!
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 max-w-sm w-full text-left space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">01</span>
          <p className="text-gray-700 text-sm">
            3 rounds — guess the mystery character
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">02</span>
          <p className="text-gray-700 text-sm">
            5 hints per round, revealed one at a time
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">03</span>
          <p className="text-gray-700 text-sm">
            Fewer hints needed = more points earned
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-blue-600 font-bold text-sm mt-0.5">04</span>
          <p className="text-gray-700 text-sm">
            Max score: 15 points — can you guess them all on the first hint?
          </p>
        </div>
      </div>

      {hasPlayed && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 max-w-sm w-full">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-3 tracking-wide">
            Your Stats
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
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
              <p className="text-xs text-gray-500">Accuracy</p>
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
