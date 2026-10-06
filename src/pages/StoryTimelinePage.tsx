import { Link } from 'react-router-dom'
import { ChartCard } from '../components/common/ChartCard'
import StoryTimeline from '../components/timeline/StoryTimeline'

/**
 * Interactive Story Timeline page — explore One Piece from sagas down to
 * individual chapters by zooming and drilling into the timeline.
 */
export default function StoryTimelinePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Home
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
          <span className="text-gray-900 font-medium">Story Timeline</span>
        </nav>

        {/* Hero */}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                  Story Timeline
                </h1>
                <p className="text-gray-600 text-base md:text-lg mt-2">
                  Explore the story as a graph — all sagas linked in order.
                  Click a saga to fly into its arcs, then an arc into its
                  chapters.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <ChartCard
          title="Interactive Story Timeline"
          description="All sagas linked in chronological order. Click a saga to fly into its arcs (shown inside it), then an arc into its chapters. Drag nodes, scroll to zoom; double-click any node for its description and characters."
          chartId="story-timeline"
          embedPath="/embed/insights/story-timeline"
          downloadFileName="story-timeline"
        >
          <StoryTimeline />
        </ChartCard>
      </div>
    </main>
  )
}
