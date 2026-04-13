import { useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchInsightsRawData,
  computeArcLengths,
  computePagesPerArc,
  computeSagaPacing,
  computeYearlyReleases,
  computeChapterComplexity,
} from '../../services/analyticsService'
import { StorySection } from '../../components/insights/StorySection'
import { ArcLengthSection } from '../../components/analytics/ArcLengthSection'
import { PublicationRateSection } from '../../components/analytics/PublicationRateSection'

function StoryTopicPage() {
  const location = useLocation()

  // Scroll to chart anchor after data loads
  useEffect(() => {
    const fullHash = window.location.hash
    const anchorMatch = fullHash.match(/#([^/][^#]*)$/)
    if (anchorMatch) {
      const el = document.getElementById(anchorMatch[1])
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          300
        )
      }
    }
  }, [location])

  const { data: raw, isLoading } = useQuery({
    queryKey: ['insights-raw-data'],
    queryFn: fetchInsightsRawData,
    staleTime: 10 * 60 * 1000,
  })

  const insights = useMemo(() => {
    if (!raw) return null
    const { arcs, sagas, characters, chapters } = raw
    return {
      arcLengths: computeArcLengths(arcs),
      pagesPerArc: computePagesPerArc(arcs, chapters),
      sagaPacing: computeSagaPacing(sagas, arcs, characters, chapters),
      yearlyReleases: computeYearlyReleases(chapters),
      chapterComplexity: computeChapterComplexity(
        characters,
        arcs,
        chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) : 0
      ),
    }
  }, [raw])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
        </div>
      </main>
    )
  }

  if (!insights) return null

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
            Story &amp; Publication
          </span>
        </nav>

        {/* Hero */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                  Story &amp; Publication
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Arc lengths, page counts, saga pacing, and publication trends
                </p>
              </div>
            </div>
          </div>
        </div>

        <StorySection
          arcLengths={insights.arcLengths}
          pagesPerArc={insights.pagesPerArc}
          sagaPacing={insights.sagaPacing}
          yearlyReleases={insights.yearlyReleases}
          chapterComplexity={insights.chapterComplexity}
        />

        <ArcLengthSection />

        <PublicationRateSection />
      </div>
    </main>
  )
}

export default StoryTopicPage
