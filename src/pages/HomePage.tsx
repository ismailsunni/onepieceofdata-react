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
    <main className="container mx-auto px-4 py-6 md:py-12">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3 md:mb-4">
          Welcome to One Piece of Data
        </h2>
        <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
          Your comprehensive data exploration platform for the One Piece
          universe. Dive into character stats, story arcs, and devil fruit
          abilities.
        </p>
      </div>

      {/* Database Statistics */}
      <div className="mb-8 md:mb-12">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 text-center">
          Database Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
          <StatCard
            icon="📚"
            label="Chapters"
            value={stats?.chapters || 0}
            loading={isLoading}
          />
          <StatCard
            icon="📖"
            label="Volumes"
            value={stats?.volumes || 0}
            loading={isLoading}
          />
          <StatCard
            icon="🎭"
            label="Arcs"
            value={stats?.arcs || 0}
            loading={isLoading}
          />
          <StatCard
            icon="🌊"
            label="Sagas"
            value={stats?.sagas || 0}
            loading={isLoading}
          />
          <StatCard
            icon="👥"
            label="Characters"
            value={stats?.characters || 0}
            loading={isLoading}
          />
          <StatCard
            icon="📄"
            label="Total Pages"
            value={stats?.totalPages.toLocaleString() || 0}
            loading={isLoading}
          />
          <StatCard
            icon="📅"
            label="Publication (days)"
            value={stats?.publicationSpan || 'Unknown'}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <Card
          icon="👤"
          title="Characters"
          description="Explore detailed information about your favorite One Piece characters, their abilities, and bounties."
        />
        <Card
          icon="📖"
          title="Story Arcs"
          description="Journey through the various story arcs and discover key events that shaped the One Piece world."
        />
        <Card
          icon="📊"
          title="Analytics"
          description="Visualize data through interactive charts and discover insights about the One Piece universe."
        />
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-500">
          Built with React, TypeScript, and TailwindCSS
        </p>
      </div>
    </main>
  )
}

export default HomePage
