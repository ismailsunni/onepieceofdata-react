import { Link } from 'react-router-dom'
import { Column } from '../common/SortableTable'
import { type BountyJump } from '../../services/analyticsService'

export const formatBounty = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

export const SAGA_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#14b8a6',
  '#e11d48',
]

export const bountyJumpColumns: Column<BountyJump>[] = [
  {
    key: 'name',
    label: 'Character',
    sortValue: (row) => row.name,
    render: (row) => (
      <Link
        to={`/characters/${row.id}`}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
      >
        {row.name}
      </Link>
    ),
  },
  {
    key: 'firstBounty',
    label: 'First Bounty',
    sortValue: (row) => row.firstBounty,
    render: (row) => (
      <span className="text-gray-600">{formatBounty(row.firstBounty)}</span>
    ),
  },
  {
    key: 'lastBounty',
    label: 'Last Bounty',
    sortValue: (row) => row.lastBounty,
    render: (row) => (
      <span className="font-medium text-amber-600">
        {formatBounty(row.lastBounty)}
      </span>
    ),
  },
  {
    key: 'jump',
    label: 'Jump',
    sortValue: (row) => row.jump,
    render: (row) => (
      <span
        className={`font-medium ${row.jump >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
      >
        {row.jump >= 0 ? '+' : '-'}
        {formatBounty(Math.abs(row.jump))}
      </span>
    ),
  },
  {
    key: 'multiplier',
    label: 'Multiplier',
    sortValue: (row) => row.multiplier,
    render: (row) => (
      <span
        className={`font-bold ${row.multiplier >= 1 ? 'text-purple-600' : 'text-red-600'}`}
      >
        {row.multiplier}x
      </span>
    ),
  },
]
