import { useQuery } from '@tanstack/react-query'
import { fetchArcs } from '../services/arcService'
import ArcLengthChart from '../components/ArcLengthChart'

function StoryArcsAnalyticsPage() {
  // Fetch arcs data
  const { data: arcs = [], isLoading: arcsLoading } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Story & Arc Analytics
        </h1>
        <p className="text-lg text-gray-600">
          Visualize the length and progression of story arcs across the One Piece saga
        </p>
      </div>

      {/* Loading State */}
      {arcsLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Charts */}
      {!arcsLoading && (
        <div className="space-y-8">
          {/* Arc Length Chart - Full Width */}
          {arcs.length > 0 && (
            <div className="w-full">
              <ArcLengthChart arcs={arcs} />
            </div>
          )}

          {/* Empty State */}
          {arcs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                No story arc data available at the moment.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default StoryArcsAnalyticsPage
