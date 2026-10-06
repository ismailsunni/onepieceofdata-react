import { Link } from 'react-router-dom'
import { CharacterAppearanceRaceSection } from '../components/analytics/CharacterAppearanceRaceSection'

function CharacterAppearanceRacePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link
            to="/analytics"
            className="hover:text-gray-900 transition-colors"
          >
            Analytics
          </Link>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900 font-medium">
            Character Appearance Race
          </span>
        </nav>

        {/* Hero Section */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 md:w-9 md:h-9 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                  Appearance Race
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Watch the top 10 characters evolve across every chapter,
                  scored by appearances in the rolling window.
                </p>
              </div>
            </div>
          </div>
        </div>

        <CharacterAppearanceRaceSection />
      </div>
    </main>
  )
}

export default CharacterAppearanceRacePage
