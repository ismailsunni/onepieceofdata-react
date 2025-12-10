import { useQuery } from '@tanstack/react-query'
import {
  fetchAppearanceDistribution,
  fetchSagaAppearanceDistribution,
  fetchSagaAppearanceCountDistribution,
} from '../services/analyticsService'
import CharacterAppearanceChart from '../components/CharacterAppearanceChart'
import { SagaAppearanceChart } from '../components/SagaAppearanceChart'
import { SagaAppearanceCountChart } from '../components/SagaAppearanceCountChart'

function CharacterAppearancesPage() {
  // Fetch appearance analytics data
  const { data: appearanceData = [], isLoading: appearanceLoading } = useQuery({
    queryKey: ['analytics', 'appearance-distribution'],
    queryFn: fetchAppearanceDistribution,
  })

  const { data: sagaAppearanceData = [], isLoading: sagaAppearanceLoading } = useQuery({
    queryKey: ['analytics', 'saga-appearance-distribution'],
    queryFn: fetchSagaAppearanceDistribution,
  })

  const { data: sagaAppearanceCountData = [], isLoading: sagaAppearanceCountLoading } = useQuery({
    queryKey: ['analytics', 'saga-appearance-count-distribution'],
    queryFn: fetchSagaAppearanceCountDistribution,
  })

  const isLoading =
    appearanceLoading ||
    sagaAppearanceLoading ||
    sagaAppearanceCountLoading

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Character Appearances
        </h1>
        <p className="text-lg text-gray-600">
          Explore how characters appear and are introduced throughout the story
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Charts Grid */}
      {!isLoading && (
        <div className="space-y-8">
          {/* Character Appearances by Chapter Range */}
          {appearanceData.length > 0 && (
            <div className="w-full">
              <CharacterAppearanceChart data={appearanceData} />
            </div>
          )}

          {/* Characters Introduced per Saga - Full Width */}
          {sagaAppearanceData.length > 0 && (
            <div className="w-full">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Characters Introduced per Saga
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                  Distribution of character debuts across all 11 major sagas of One Piece
                </p>
                <SagaAppearanceChart data={sagaAppearanceData} />
              </div>
            </div>
          )}

          {/* Saga Appearance Count Distribution - Full Width */}
          {sagaAppearanceCountData.length > 0 && (
            <div className="w-full">
              <SagaAppearanceCountChart data={sagaAppearanceCountData} />
            </div>
          )}

          {/* Empty State */}
          {appearanceData.length === 0 &&
            sagaAppearanceData.length === 0 &&
            sagaAppearanceCountData.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  No character appearance data available at the moment.
                </p>
              </div>
            )}
        </div>
      )}
    </main>
  )
}

export default CharacterAppearancesPage
