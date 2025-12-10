import { Link } from 'react-router-dom'

function AnalyticsPage() {
  const analyticsCategories = [
    {
      title: 'Character Statistics',
      description: 'Analyze character bounties, status distribution, and rankings',
      path: '/analytics/character-stats',
      icon: '👥',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    },
    {
      title: 'Character Appearances',
      description: 'Explore character introductions and appearance patterns across sagas',
      path: '/analytics/character-appearances',
      icon: '📊',
      color: 'bg-green-50 border-green-200 hover:border-green-400',
    },
    {
      title: 'Story & Arc Analytics',
      description: 'Visualize arc lengths and story progression',
      path: '/analytics/story-arcs',
      icon: '📖',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    },
  ]

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Explore visual insights and statistics from the One Piece universe
        </p>
      </div>

      {/* Analytics Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {analyticsCategories.map((category) => (
          <Link
            key={category.path}
            to={category.path}
            className={`${category.color} border-2 rounded-lg p-6 transition-all hover:shadow-lg`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{category.icon}</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {category.title}
                </h2>
                <p className="text-gray-600">
                  {category.description}
                </p>
              </div>
              <div className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Data visualizations are generated from the One Piece database.
          Charts update automatically as new data is added.
        </p>
      </div>
    </main>
  )
}

export default AnalyticsPage
