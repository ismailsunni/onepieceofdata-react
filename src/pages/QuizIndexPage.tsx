import { Navigate } from 'react-router-dom'

const QUIZZES = [
  { path: '/quiz/guess-character', label: 'Guess the Character' },
]

export default function QuizIndexPage() {
  // If there's only one quiz, redirect directly to it
  if (QUIZZES.length === 1) {
    return <Navigate to={QUIZZES[0].path} replace />
  }

  // Future: render a list of available quizzes
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Quizzes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUIZZES.map((quiz) => (
          <a
            key={quiz.path}
            href={`#${quiz.path}`}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {quiz.label}
            </h2>
          </a>
        ))}
      </div>
    </div>
  )
}
