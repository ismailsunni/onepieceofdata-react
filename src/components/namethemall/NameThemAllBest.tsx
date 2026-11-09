import type { NameThemAllStats } from '../../services/nameThemAllStatsService'

export default function NameThemAllBest({
  stats,
  isNewBest = false,
}: {
  stats: NameThemAllStats
  isNewBest?: boolean
}) {
  if (stats.gamesPlayed === 0) return null
  const pct = stats.total
    ? Math.round((stats.bestCorrect / stats.total) * 100)
    : 0

  return (
    <div className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase font-semibold mb-3 tracking-wide text-center">
        Your Best · this round
      </p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900">
            {stats.bestCorrect} / {stats.total}
          </p>
          <p className="text-xs text-gray-500">Best ({pct}%)</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{stats.bestWrong}</p>
          <p className="text-xs text-gray-500">Wrong (best)</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{stats.gamesPlayed}</p>
          <p className="text-xs text-gray-500">Games</p>
        </div>
      </div>
      {isNewBest && stats.gamesPlayed > 1 && (
        <p className="text-center text-sm text-green-600 font-medium mt-3">
          New personal best!
        </p>
      )}
    </div>
  )
}
