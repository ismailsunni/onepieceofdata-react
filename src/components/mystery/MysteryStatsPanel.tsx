import type { MysteryStats } from '../../services/mysteryCharacterStatsService'

export default function MysteryStatsPanel({
  stats,
  isNewBest = false,
  highlight,
}: {
  stats: MysteryStats
  isNewBest?: boolean
  highlight?: number // guess count of the game just won
}) {
  if (stats.played === 0) return null
  const max = Math.max(1, ...stats.distribution)
  const cells: [string, string | number][] = [
    ['Played', stats.played],
    ['Win %', Math.round((stats.wins / stats.played) * 100)],
    ['Streak', stats.currentStreak],
    ['Best Streak', stats.bestStreak],
    ['Best', stats.bestGuesses ? `${stats.bestGuesses} guesses` : '—'],
  ]

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left">
      <p className="text-xs text-gray-500 uppercase font-semibold mb-3 tracking-wide text-center">
        Your Stats
      </p>
      <div className="grid grid-cols-5 gap-2 text-center mb-4">
        {cells.map(([label, value]) => (
          <div key={label}>
            <p className="text-base font-bold text-gray-900">{value}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1" aria-label="Guess distribution">
        {stats.distribution.map((n, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-gray-600">{i + 1}</span>
            <div
              className={`h-4 rounded px-1.5 text-right font-semibold text-white ${
                highlight === i + 1 ? 'bg-green-600' : 'bg-gray-400'
              }`}
              style={{ width: `${Math.max(8, (n / max) * 100)}%` }}
            >
              {n}
            </div>
          </div>
        ))}
      </div>
      {isNewBest && stats.wins > 1 && (
        <p className="text-center text-sm text-green-600 font-medium mt-3">
          New personal best!
        </p>
      )}
    </div>
  )
}
