import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { fetchDatabaseStats } from '../services/statsService'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faQuestion } from '@fortawesome/free-solid-svg-icons'

function HomePage() {
  // Use React Query to fetch and cache database statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchDatabaseStats,
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Explore the One Piece Universe Through Data
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Your comprehensive data exploration platform for characters, story
              arcs, chapters, and analytics from the world of One Piece.
            </p>
          </div>
        </div>
      </section>

      {/* Database Statistics */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              variant="simple"
              icon="📚"
              label="Chapters"
              value={stats?.chapters || 0}
              loading={isLoading}
              link="/chapters"
            />
            <StatCard
              variant="simple"
              icon="📖"
              label="Volumes"
              value={stats?.volumes || 0}
              loading={isLoading}
              link="/volumes"
            />
            <StatCard
              variant="simple"
              icon="🎭"
              label="Arcs"
              value={stats?.arcs || 0}
              loading={isLoading}
              link="/arcs"
            />
            <StatCard
              variant="simple"
              icon="🌊"
              label="Sagas"
              value={stats?.sagas || 0}
              loading={isLoading}
              link="/sagas"
            />
            <StatCard
              variant="simple"
              icon="👥"
              label="Characters"
              value={stats?.characters || 0}
              loading={isLoading}
              link="/characters"
            />
            <StatCard
              variant="simple"
              icon="📄"
              label="Total Pages"
              value={stats?.totalPages.toLocaleString() || 0}
              loading={isLoading}
            />
            <StatCard
              variant="simple"
              icon="📅"
              label="Publication"
              value={
                stats?.publicationSpan
                  ? `${stats.publicationSpan} days`
                  : 'Unknown'
              }
              loading={isLoading}
            />
            <StatCard
              variant="simple"
              icon="🏴"
              label="Affiliations"
              value={stats?.affiliations || 0}
              loading={isLoading}
              link="/affiliations"
            />
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Start Exploring
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Dive into detailed data across characters, story arcs, and visual
              analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              icon="👤"
              title="Characters"
              description="Explore detailed information about your favorite One Piece characters, their abilities, devil fruits, haki, and bounties."
              link="/characters"
            />
            <Card
              icon="📖"
              title="Story Arcs"
              description="Journey through the various story arcs and discover key events that shaped the One Piece world."
              link="/arcs"
            />
            <Card
              icon="📊"
              title="Analytics"
              description="Visualize data through interactive charts and discover insights about the One Piece universe."
              link="/analytics"
            />
            <Card
              icon="🍎"
              title="Devil Fruits"
              description="Browse all known Devil Fruits — Paramecia, Zoan, and Logia — with their powers and users."
              link="/devil-fruits"
            />
            <Card
              icon="🏴"
              title="Affiliations"
              description="Discover the crews, organizations, and groups that shape alliances and rivalries across the seas."
              link="/affiliations"
            />
            <Card
              icon="🗺️"
              title="Network Analysis"
              description="Explore character co-appearance networks and discover connections between characters across chapters."
              link="/analytics/network"
            />
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Test Your Knowledge
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Think you know One Piece? Put your knowledge to the test with
              these mini-games.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link
              to="/games/guess-character"
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FontAwesomeIcon icon={faImage} className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Guess the Character
                </h3>
              </div>
              <p className="text-sm text-gray-500">
                Identify One Piece characters from their portrait image. 5
                questions, timed!
              </p>
            </Link>

            <Link
              to="/games/who-am-i"
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FontAwesomeIcon icon={faQuestion} className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Who Am I?
                </h3>
              </div>
              <p className="text-sm text-gray-500">
                Guess the character from progressive hints. Fewer hints = more
                points!
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Built with passion for the One Piece community</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
