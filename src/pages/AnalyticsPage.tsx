import { useQuery } from '@tanstack/react-query'
import {
  fetchBountyDistribution,
  fetchStatusDistribution,
  fetchTopBounties,
  fetchAppearanceDistribution,
} from '../services/analyticsService'
import { fetchArcs } from '../services/arcService'
import BountyDistributionChart from '../components/BountyDistributionChart'
import CharacterStatusChart from '../components/CharacterStatusChart'
import TopBountiesChart from '../components/TopBountiesChart'
import CharacterAppearanceChart from '../components/CharacterAppearanceChart'
import ArcLengthChart from '../components/ArcLengthChart'

function AnalyticsPage() {
  // Fetch all analytics data using React Query
  const { data: bountyDataAll = [], isLoading: bountyLoadingAll } = useQuery({
    queryKey: ['analytics', 'bounty-distribution', 'all'],
    queryFn: () => fetchBountyDistribution(false),
  })

  const { data: bountyDataAlive = [], isLoading: bountyLoadingAlive } = useQuery({
    queryKey: ['analytics', 'bounty-distribution', 'alive'],
    queryFn: () => fetchBountyDistribution(true),
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

  const { data: arcs = [], isLoading: arcsLoading } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  const isLoading =
    bountyLoadingAll ||
    bountyLoadingAlive ||
    statusLoading ||
    topBountiesLoadingAll ||
    topBountiesLoadingAlive ||
    appearanceLoading ||
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
            {bountyDataAll.length > 0 && (
              <BountyDistributionChart 
                dataAll={bountyDataAll}
                dataAlive={bountyDataAlive}
              />
            )}

            {/* Character Status */}
            {statusData.length > 0 && (
              <CharacterStatusChart data={statusData} />
            )}
          </div>

          {/* Two Column Layout Continued */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Character Appearances */}
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

          {/* Empty State */}
          {bountyDataAll.length === 0 &&
            statusData.length === 0 &&
            topBountiesAll.length === 0 &&
            appearanceData.length === 0 &&
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
