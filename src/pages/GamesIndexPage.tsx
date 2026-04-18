import { Navigate } from 'react-router-dom'

const GAMES = [
  { path: '/games/guess-character', label: 'Guess the Character' },
  { path: '/games/who-am-i', label: 'Who Am I?' },
]

export default function GamesIndexPage() {
  // If there's only one game, redirect directly to it
  if (GAMES.length === 1) {
    return <Navigate to={GAMES[0].path} replace />
  }

  // Future: render a list of available games
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Games</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game) => (
          <a
            key={game.path}
            href={`#${game.path}`}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {game.label}
            </h2>
          </a>
        ))}
      </div>
    </div>
  )
}
