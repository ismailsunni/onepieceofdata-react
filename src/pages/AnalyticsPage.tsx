import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { StatCard } from '../components/analytics'

function AnalyticsPage() {
  // Fetch basic stats for the dashboard
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }

      const [characters, arcs, chapters, sagas] = await Promise.all([
        supabase.from('character').select('id', { count: 'exact', head: true }),
        supabase.from('arc').select('arc_id', { count: 'exact', head: true }),
        supabase
          .from('chapter')
          .select('number', { count: 'exact', head: true }),
        supabase.from('saga').select('saga_id', { count: 'exact', head: true }),
      ])

      return {
        characters: characters.count || 0,
        arcs: arcs.count || 0,
        chapters: chapters.count || 0,
        sagas: sagas.count || 0,
      }
    },
  })

  const analyticsCategories = [
    {
      title: 'Bounty & Power',
      description:
        'Bounty inflation, regional power rankings, top bounties, tier distributions, and biggest bounty jumps',
      path: '/analytics/bounty',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      gradient: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Appearances & Longevity',
      description:
        'Saga appearance charts, longest disappearances, one-saga wonders, time-skip analysis, and character heatmaps',
      path: '/analytics/appearances',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      gradient: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Story & Publication',
      description:
        'Arc lengths, publication rate, break patterns, chapter-per-arc trends, and story progression analytics',
      path: '/analytics/story',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Demographics & World-Building',
      description:
        'Birthday calendar, age distributions, origin regions, and character demographic patterns',
      path: '/analytics/demographics',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      gradient: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      iconColor: 'text-pink-600',
    },
    {
      title: 'Character Rankings & Meta',
      description:
        'Cover page appearances, character rankings, data completeness, and database coverage analysis',
      path: '/analytics/characters',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
      gradient: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-600',
    },
    {
      title: 'Affiliations & Organizations',
      description:
        'Crew loyalty analysis, affiliation network graph, and organization membership patterns',
      path: '/analytics/affiliations',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      gradient: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      iconColor: 'text-rose-600',
    },
    {
      title: 'Character Network',
      description:
        'Interactive graph of character co-appearances across arcs, sagas, and chapters',
      path: '/analytics/network',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      gradient: 'from-indigo-500 to-violet-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-600',
    },
    {
      title: 'Character Timeline',
      description:
        'Compare chapter appearance timelines for multiple characters side by side with preset groups',
      path: '/analytics/character-timeline',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          />
        </svg>
      ),
      gradient: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      iconColor: 'text-teal-600',
    },
    {
      title: 'Chapter Release Calendar',
      description:
        'View chapter release schedule by year and Weekly Shonen Jump issue',
      path: '/analytics/chapter-releases',
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      gradient: 'from-amber-500 to-yellow-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 md:w-9 md:h-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Explore visual insights and statistics from the One Piece
                  universe
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <StatCard
            label="Total Characters"
            value={stats?.characters || 0}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
            color="blue"
            loading={isLoading}
            link="/characters"
          />
          <StatCard
            label="Story Arcs"
            value={stats?.arcs || 0}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
            color="purple"
            loading={isLoading}
            link="/arcs"
          />
          <StatCard
            label="Chapters"
            value={stats?.chapters || 0}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            color="emerald"
            loading={isLoading}
            link="/chapters"
          />
          <StatCard
            label="Sagas"
            value={stats?.sagas || 0}
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            }
            color="amber"
            loading={isLoading}
            link="/sagas"
          />
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analytics Categories
          </h2>
          <p className="text-gray-600">
            Choose a category to explore detailed visualizations and insights
          </p>
        </div>

        {/* Analytics Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {analyticsCategories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className="group block bg-white border-2 border-gray-200 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`${category.bgColor} ${category.iconColor} p-3 rounded-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}
                >
                  {category.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {category.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="text-gray-400 group-hover:text-gray-600 transition-all duration-200 group-hover:translate-x-1 flex-shrink-0">
                  <svg
                    className="w-6 h-6"
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
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Getting Started Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Getting Started
              </h3>
              <p className="text-gray-700 mb-4">
                Explore comprehensive analytics and visualizations of the One
                Piece universe. Each category provides interactive charts and
                insights derived from our extensive database.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Interactive charts with filtering options
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Export charts as PNG images
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Real-time data updates from the database
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Responsive design for all devices
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AnalyticsPage
