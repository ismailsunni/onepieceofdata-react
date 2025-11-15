import { useQuery } from '@tanstack/react-query'
import {
  fetchBountyDistribution,
  fetchBountyStats,
  fetchStatusDistribution,
  fetchTopBounties,
  fetchAppearanceDistribution,
  fetchSagaAppearanceDistribution,
} from '../services/analyticsService'
import { fetchArcs } from '../services/arcService'
import BountyDistributionChart from '../components/BountyDistributionChart'
import CharacterStatusChart from '../components/CharacterStatusChart'
import TopBountiesChart from '../components/TopBountiesChart'
import CharacterAppearanceChart from '../components/CharacterAppearanceChart'
import { SagaAppearanceChart } from '../components/SagaAppearanceChart'
import ArcLengthChart from '../components/ArcLengthChart'

function AnalyticsPage() {
  // Fetch all analytics data using React Query
  const { data: bountyData = [], isLoading: bountyLoading } = useQuery({
    queryKey: ['analytics', 'bounty-distribution'],
    queryFn: fetchBountyDistribution,
  })

  const { data: bountyStats, isLoading: bountyStatsLoading } = useQuery({
    queryKey: ['analytics', 'bounty-stats'],
    queryFn: fetchBountyStats,
  })

  const { data: statusData = [], isLoading: statusLoading } = useQuery({
    queryKey: ['analytics', 'status-distribution'],
    queryFn: fetchStatusDistribution,
  })

  const { data: topBountiesAll = [], isLoading: topBountiesLoadingAll } = useQuery({
    queryKey: ['analytics', 'top-bounties', 'all'],
    queryFn: () => fetchTopBounties(10, false),
  })

  const { data: topBountiesAlive = [], isLoading: topBountiesLoadingAlive } = useQuery({
    queryKey: ['analytics', 'top-bounties', 'alive'],
    queryFn: () => fetchTopBounties(10, true),
  })

  const { data: appearanceData = [], isLoading: appearanceLoading } = useQuery({
    queryKey: ['analytics', 'appearance-distribution'],
    queryFn: fetchAppearanceDistribution,
  })

  const { data: sagaAppearanceData = [], isLoading: sagaAppearanceLoading } = useQuery({
    queryKey: ['analytics', 'saga-appearance-distribution'],
    queryFn: fetchSagaAppearanceDistribution,
  })

  const { data: arcs = [], isLoading: arcsLoading } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  const isLoading =
    bountyLoading ||
    bountyStatsLoading ||
    statusLoading ||
    topBountiesLoadingAll ||
    topBountiesLoadingAlive ||
    appearanceLoading ||
    sagaAppearanceLoading ||
    arcsLoading

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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Charts Grid */}
      {!isLoading && (
        <div className="space-y-8">
          {/* Arc Length Chart - Full Width */}
          {arcs.length > 0 && (
            <div className="w-full">
              <ArcLengthChart arcs={arcs} />
            </div>
          )}

          {/* Two Column Layout for Medium Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bounty Distribution */}
            {bountyData.length > 0 && (
              <BountyDistributionChart
                data={bountyData}
                stats={bountyStats}
              />
            )}

            {/* Character Status */}
            {statusData.length > 0 && (
              <CharacterStatusChart data={statusData} />
            )}
          </div>

          {/* Two Column Layout Continued */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Character Appearances by Chapter Range */}
            {appearanceData.length > 0 && (
              <CharacterAppearanceChart data={appearanceData} />
            )}

            {/* Top Bounties - Takes remaining space or full column */}
            {topBountiesAll.length > 0 && (
              <TopBountiesChart
                dataAll={topBountiesAll}
                dataAlive={topBountiesAlive}
              />
            )}
          </div>

          {/* Saga Character Distribution - Full Width */}
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

          {/* Empty State */}
          {bountyData.length === 0 &&
            statusData.length === 0 &&
            topBountiesAll.length === 0 &&
            appearanceData.length === 0 &&
            sagaAppearanceData.length === 0 &&
            arcs.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  No analytics data available at the moment.
                </p>
              </div>
            )}
        </div>
      )}

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
