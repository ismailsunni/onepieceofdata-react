import { queryOptions } from '@tanstack/react-query'
import {
  fetchBountyDistribution,
  fetchBountyStats,
  fetchTopBounties,
} from '../services/analyticsService'

// Shared by BountyStatsSection and the build-time prefetch
export const bountyQueries = {
  distribution: queryOptions({
    queryKey: ['analytics', 'bounty-distribution'],
    queryFn: fetchBountyDistribution,
  }),
  stats: queryOptions({
    queryKey: ['analytics', 'bounty-stats'],
    queryFn: fetchBountyStats,
  }),
  topAll: queryOptions({
    queryKey: ['analytics', 'top-bounties', 'all'],
    queryFn: () => fetchTopBounties(10, false),
  }),
  topAlive: queryOptions({
    queryKey: ['analytics', 'top-bounties', 'alive'],
    queryFn: () => fetchTopBounties(10, true),
  }),
}
