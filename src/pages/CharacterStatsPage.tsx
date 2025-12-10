import { useQuery } from '@tanstack/react-query'
import {
  fetchBountyDistribution,
  fetchBountyStats,
  fetchStatusDistribution,
  fetchTopBounties,
} from '../services/analyticsService'
import BountyDistributionChart from '../components/BountyDistributionChart'
import CharacterStatusChart from '../components/CharacterStatusChart'
import TopBountiesChart from '../components/TopBountiesChart'

function CharacterStatsPage() {
  // Fetch bounty analytics data
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

  const isLoading =
    bountyLoading ||
    bountyStatsLoading ||
    statusLoading ||
    topBountiesLoadingAll ||
    topBountiesLoadingAlive

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Character Statistics
        </h1>
        <p className="text-lg text-gray-600">
          Analyze character bounties, status distribution, and rankings
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
          {/* Two Column Layout for Bounty and Status */}
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

          {/* Top Bounties - Full Width */}
          {topBountiesAll.length > 0 && (
            <div className="w-full">
              <TopBountiesChart
                dataAll={topBountiesAll}
                dataAlive={topBountiesAlive}
              />
            </div>
          )}

          {/* Empty State */}
          {bountyData.length === 0 &&
            statusData.length === 0 &&
            topBountiesAll.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">
                  No character statistics available at the moment.
                </p>
              </div>
            )}
        </div>
      )}
    </main>
  )
}

export default CharacterStatsPage
