import { useQuery } from '@tanstack/react-query'
import {
  fetchBountyDistribution,
  fetchBountyStats,
  fetchTopBounties,
} from '../../services/analyticsService'
import BountyDistributionChart from '../BountyDistributionChart'
import TopBountiesChart from '../TopBountiesChart'
import { StatCard } from './index'
import { formatBounty } from '../insights/constants'

export function BountyStatsSection() {
  const { data: bountyData = [], isLoading: bountyLoading } = useQuery({
    queryKey: ['analytics', 'bounty-distribution'],
    queryFn: fetchBountyDistribution,
  })

  const { data: bountyStats, isLoading: bountyStatsLoading } = useQuery({
    queryKey: ['analytics', 'bounty-stats'],
    queryFn: fetchBountyStats,
  })

  const { data: topBountiesAll = [], isLoading: topBountiesLoadingAll } =
    useQuery({
      queryKey: ['analytics', 'top-bounties', 'all'],
      queryFn: () => fetchTopBounties(10, false),
    })

  const { data: topBountiesAlive = [], isLoading: topBountiesLoadingAlive } =
    useQuery({
      queryKey: ['analytics', 'top-bounties', 'alive'],
      queryFn: () => fetchTopBounties(10, true),
    })

  const isLoading =
    bountyLoading ||
    bountyStatsLoading ||
    topBountiesLoadingAll ||
    topBountiesLoadingAlive

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const highestBounty = topBountiesAll[0]

  return (
    <>
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <StatCard
          label="Characters with Bounty"
          value={bountyStats?.charactersWithBounty || 0}
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="purple"
        />
        <StatCard
          label="Highest Bounty"
          value={highestBounty ? formatBounty(highestBounty.bounty) : '—'}
          subtitle={highestBounty?.name}
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          }
          color="amber"
        />
        <StatCard
          label="Bounty Coverage"
          value={bountyStats ? `${bountyStats.percentage}%` : '—'}
          subtitle={
            bountyStats
              ? `${bountyStats.charactersWithBounty} of ${bountyStats.totalCharacters} characters`
              : undefined
          }
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
          color="blue"
        />
      </div>

      {/* Bounty Distribution Chart */}
      {bountyData.length > 0 && (
        <div className="mb-6">
          <BountyDistributionChart data={bountyData} stats={bountyStats} />
        </div>
      )}

      {/* Top Bounties */}
      {topBountiesAll.length > 0 && (
        <div className="mb-6">
          <TopBountiesChart
            dataAll={topBountiesAll}
            dataAlive={topBountiesAlive}
          />
        </div>
      )}
    </>
  )
}
