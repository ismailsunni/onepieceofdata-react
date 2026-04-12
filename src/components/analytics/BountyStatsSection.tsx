import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchBountyDistribution,
  fetchBountyStats,
  fetchStatusDistribution,
  fetchTopBounties,
  fetchOriginRegionDistribution,
} from '../../services/analyticsService'
import BountyDistributionChart from '../BountyDistributionChart'
import CharacterStatusChart from '../CharacterStatusChart'
import TopBountiesChart from '../TopBountiesChart'
import OriginRegionChart from '../OriginRegionChart'
import { StatCard } from './index'

export function BountyStatsSection() {
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

  const { data: originRegionData = [], isLoading: originRegionLoading } =
    useQuery({
      queryKey: ['analytics', 'origin-region-distribution'],
      queryFn: fetchOriginRegionDistribution,
    })

  const isLoading =
    bountyLoading ||
    bountyStatsLoading ||
    statusLoading ||
    topBountiesLoadingAll ||
    topBountiesLoadingAlive ||
    originRegionLoading

  const stats = useMemo(() => {
    const total = bountyStats?.totalCharacters || 0
    const aliveCount = statusData.find((s) => s.status === 'Alive')?.count || 0
    const charactersWithBounty = bountyStats?.charactersWithBounty || 0
    return { totalCharacters: total, charactersWithBounty, aliveCount }
  }, [bountyStats, statusData])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          label="Total Characters"
          value={stats.totalCharacters}
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
        />
        <StatCard
          label="Characters with Bounty"
          value={stats.charactersWithBounty}
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
          label="Living Characters"
          value={stats.aliveCount}
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          }
          color="green"
        />
        <StatCard
          label="Devil Fruit Users"
          value="Coming Soon"
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {bountyData.length > 0 && (
          <BountyDistributionChart data={bountyData} stats={bountyStats} />
        )}
        {statusData.length > 0 && <CharacterStatusChart data={statusData} />}
      </div>

      {/* Top Bounties */}
      {topBountiesAll.length > 0 && (
        <div className="mb-6">
          <TopBountiesChart
            dataAll={topBountiesAll}
            dataAlive={topBountiesAlive}
          />
        </div>
      )}

      {/* Origin Region Distribution */}
      {originRegionData.length > 0 && (
        <div className="mb-6">
          <OriginRegionChart data={originRegionData} />
        </div>
      )}

      {/* Insights Panel */}
      {bountyStats && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900">
              Key Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Bounty Coverage</p>
              <p className="text-2xl font-bold text-blue-600">
                {bountyStats.percentage}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {bountyStats.charactersWithBounty} of{' '}
                {bountyStats.totalCharacters} characters have bounties
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Survival Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {bountyStats.totalCharacters
                  ? Math.round(
                      (stats.aliveCount / bountyStats.totalCharacters) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.aliveCount} characters are confirmed alive
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
