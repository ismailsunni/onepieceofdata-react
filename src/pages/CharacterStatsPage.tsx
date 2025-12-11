import { useMemo, useRef } from 'react'
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
import { StatCard, ChartCard } from '../components/analytics'
import { toPng } from 'html-to-image'

function CharacterStatsPage() {
  const bountyChartRef = useRef<HTMLDivElement>(null)
  const statusChartRef = useRef<HTMLDivElement>(null)
  const topBountiesChartRef = useRef<HTMLDivElement>(null)

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

  // Calculate additional statistics
  const stats = useMemo(() => {
    const total = bountyStats?.totalCharacters || 0
    const aliveCount = statusData.find(s => s.status === 'Alive')?.count || 0
    const charactersWithBounty = bountyStats?.charactersWithBounty || 0

    return {
      totalCharacters: total,
      charactersWithBounty,
      aliveCount,
    }
  }, [bountyStats, statusData])


  // Export chart as PNG
  const handleExportChart = async (chartRef: React.RefObject<HTMLDivElement | null>, chartName: string) => {
    if (chartRef.current) {
      try {
        const dataUrl = await toPng(chartRef.current, {
          quality: 0.95,
          pixelRatio: 2,
        })
        const link = document.createElement('a')
        link.download = `${chartName}-${Date.now()}.png`
        link.href = dataUrl
        link.click()
      } catch (error) {
        console.error('Error exporting chart:', error)
      }
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative mb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  Character Statistics
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Analyze character bounties, status distribution, and rankings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Total Characters"
                value={stats.totalCharacters}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              />
              <StatCard
                label="Characters with Bounty"
                value={stats.charactersWithBounty}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                color="purple"
                loading={isLoading}
              />
              <StatCard
                label="Living Characters"
                value={stats.aliveCount}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                }
                color="green"
                loading={isLoading}
              />
              <StatCard
                label="Devil Fruit Users"
                value="Coming Soon"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
                color="amber"
                loading={isLoading}
              />
            </div>

            {/* Filter Section - Temporarily disabled to avoid conflicts with chart controls */}
            {/* <SectionHeader
              title="Filter by Character Type"
              description="Select a category to focus on specific character groups"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              }
            />

            <div className="flex flex-wrap gap-3 mb-8">
              <FilterButton
                active={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
                variant="primary"
              >
                All Characters
              </FilterButton>
              <FilterButton
                active={activeFilter === 'alive'}
                onClick={() => setActiveFilter('alive')}
                count={stats.aliveCount}
              >
                Living Only
              </FilterButton>
              <FilterButton
                active={activeFilter === 'bounty'}
                onClick={() => setActiveFilter('bounty')}
                count={bountyStats?.charactersWithBounty}
              >
                Has Bounty
              </FilterButton>
            </div> */}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Bounty Distribution */}
              {bountyData.length > 0 && (
                <ChartCard
                  title="Bounty Distribution by Power Tier"
                  description="Character distribution across bounty ranges showing power tiers"
                  onExport={() => handleExportChart(bountyChartRef, 'bounty-distribution')}
                >
                  <div ref={bountyChartRef}>
                    <BountyDistributionChart
                      data={bountyData}
                      stats={bountyStats}
                    />
                  </div>
                </ChartCard>
              )}

              {/* Character Status */}
              {statusData.length > 0 && (
                <ChartCard
                  title="Character Status Distribution"
                  description="Distribution of character statuses (Alive, Deceased, Unknown)"
                  onExport={() => handleExportChart(statusChartRef, 'status-distribution')}
                >
                  <div ref={statusChartRef}>
                    <CharacterStatusChart data={statusData} />
                  </div>
                </ChartCard>
              )}
            </div>

            {/* Top Bounties - Full Width */}
            {topBountiesAll.length > 0 && (
              <ChartCard
                title="Top 10 Highest Bounties"
                description="Ranking of characters by bounty amount (All vs Living characters)"
                onExport={() => handleExportChart(topBountiesChartRef, 'top-bounties')}
                className="mb-6"
              >
                <div ref={topBountiesChartRef}>
                  <TopBountiesChart
                    dataAll={topBountiesAll}
                    dataAlive={topBountiesAlive}
                  />
                </div>
              </ChartCard>
            )}

            {/* Insights Panel */}
            {bountyStats && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900">Key Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Bounty Coverage</p>
                    <p className="text-2xl font-bold text-blue-600">{bountyStats.percentage}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {bountyStats.charactersWithBounty} of {bountyStats.totalCharacters} characters have bounties
                    </p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Survival Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {bountyStats.totalCharacters ? Math.round((stats.aliveCount / bountyStats.totalCharacters) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.aliveCount} characters are confirmed alive
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {bountyData.length === 0 &&
              statusData.length === 0 &&
              topBountiesAll.length === 0 && (
                <div className="text-center py-20">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">
                    No character statistics available at the moment.
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </main>
  )
}

export default CharacterStatsPage
