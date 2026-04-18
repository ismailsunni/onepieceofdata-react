import { Navigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faQuestion } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const GAMES: {
  path: string
  label: string
  description: string
  icon: IconDefinition
}[] = [
  {
    path: '/games/guess-character',
    label: 'Guess the Character',
    description:
      'Identify One Piece characters from their portrait image. 5 questions, timed!',
    icon: faImage,
  },
  {
    path: '/games/who-am-i',
    label: 'Who Am I?',
    description:
      'Guess the character from progressive hints. Fewer hints = more points!',
    icon: faQuestion,
  },
]

export default function GamesIndexPage() {
  // If there's only one game, redirect directly to it
  if (GAMES.length === 1) {
    return <Navigate to={GAMES[0].path} replace />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Games</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game) => (
          <a
            key={game.path}
            href={`#${game.path}`}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FontAwesomeIcon icon={game.icon} className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {game.label}
              </h2>
            </div>
            <p className="text-sm text-gray-500">{game.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
