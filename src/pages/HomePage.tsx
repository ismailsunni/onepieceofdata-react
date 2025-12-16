import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { fetchDatabaseStats } from '../services/statsService'

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
              Your comprehensive data exploration platform for characters, story arcs,
              chapters, and analytics from the world of One Piece.
            </p>
          </div>
        </div>
      </section>

      {/* Database Statistics */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon="📚"
              label="Chapters"
              value={stats?.chapters || 0}
              loading={isLoading}
              link="/chapters"
            />
            <StatCard
              icon="📖"
              label="Volumes"
              value={stats?.volumes || 0}
              loading={isLoading}
              link="/volumes"
            />
            <StatCard
              icon="🎭"
              label="Arcs"
              value={stats?.arcs || 0}
              loading={isLoading}
              link="/arcs"
            />
            <StatCard
              icon="🌊"
              label="Sagas"
              value={stats?.sagas || 0}
              loading={isLoading}
              link="/sagas"
            />
            <StatCard
              icon="👥"
              label="Characters"
              value={stats?.characters || 0}
              loading={isLoading}
              link="/characters"
            />
            <StatCard
              icon="📄"
              label="Total Pages"
              value={stats?.totalPages.toLocaleString() || 0}
              loading={isLoading}
            />
            <StatCard
              icon="📅"
              label="Publication"
              value={stats?.publicationSpan ? `${stats.publicationSpan} days` : 'Unknown'}
              loading={isLoading}
            />
            <StatCard
              icon="📊"
              label="Data Points"
              value={(stats ? stats.chapters + stats.volumes + stats.arcs + stats.sagas + stats.characters : 0).toLocaleString()}
              loading={isLoading}
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
              Dive into detailed data across characters, story arcs, and visual analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              icon="👤"
              title="Characters"
              description="Explore detailed information about your favorite One Piece characters, their abilities, and bounties."
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
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-gray-50 border-t border-gray-200">
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
