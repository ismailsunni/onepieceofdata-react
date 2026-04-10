import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAllAffiliations } from '../services/affiliationService'
import SortableTable, { Column } from '../components/common/SortableTable'

interface AffiliationGroup {
  groupName: string
  totalMembers: number
  currentMembers: number
  formerMembers: number
  subGroups: string[]
  statuses: string[]
}

function AffiliationsPage() {
  const [search, setSearch] = useState('')

  const { data: affiliations = [], isLoading } = useQuery({
    queryKey: ['all-affiliations'],
    queryFn: fetchAllAffiliations,
    staleTime: 10 * 60 * 1000,
  })

  const groups = useMemo(() => {
    const map = new Map<string, AffiliationGroup>()

    for (const aff of affiliations) {
      const existing = map.get(aff.group_name)
      if (existing) {
        existing.totalMembers++
        if (aff.status === 'current') existing.currentMembers++
        if (aff.status === 'former' || aff.status === 'defected')
          existing.formerMembers++
        if (aff.sub_group && !existing.subGroups.includes(aff.sub_group))
          existing.subGroups.push(aff.sub_group)
        if (!existing.statuses.includes(aff.status))
          existing.statuses.push(aff.status)
      } else {
        map.set(aff.group_name, {
          groupName: aff.group_name,
          totalMembers: 1,
          currentMembers: aff.status === 'current' ? 1 : 0,
          formerMembers:
            aff.status === 'former' || aff.status === 'defected' ? 1 : 0,
          subGroups: aff.sub_group ? [aff.sub_group] : [],
          statuses: [aff.status],
        })
      }
    }

    return Array.from(map.values())
  }, [affiliations])

  const filtered = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.toLowerCase()
    return groups.filter((g) => g.groupName.toLowerCase().includes(q))
  }, [groups, search])

  const columns: Column<AffiliationGroup>[] = [
    {
      key: 'groupName',
      label: 'Group / Organization',
      sortValue: (row) => row.groupName,
      render: (row) => (
        <Link
          to={`/affiliations/${encodeURIComponent(row.groupName)}`}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {row.groupName}
        </Link>
      ),
    },
    {
      key: 'totalMembers',
      label: 'Members',
      sortValue: (row) => row.totalMembers,
      render: (row) => (
        <span className="font-semibold text-gray-900">{row.totalMembers}</span>
      ),
    },
    {
      key: 'currentMembers',
      label: 'Current',
      sortValue: (row) => row.currentMembers,
      render: (row) => (
        <span className="text-emerald-600 font-medium">
          {row.currentMembers}
        </span>
      ),
    },
    {
      key: 'formerMembers',
      label: 'Former / Defected',
      sortValue: (row) => row.formerMembers,
      render: (row) => (
        <span className="text-gray-500">{row.formerMembers}</span>
      ),
    },
    {
      key: 'subGroups',
      label: 'Sub-groups',
      sortValue: (row) => row.subGroups.length,
      render: (row) =>
        row.subGroups.length > 0 ? (
          <span className="text-xs text-gray-500">
            {row.subGroups.slice(0, 3).join(', ')}
            {row.subGroups.length > 3 && ` +${row.subGroups.length - 3}`}
          </span>
        ) : (
          <span className="text-gray-300">&ndash;</span>
        ),
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900 font-medium">Affiliations</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Affiliations
          </h1>
          <p className="text-lg text-gray-600">
            All crews, organizations, and groups in the One Piece world
            {groups.length > 0 && (
              <span className="ml-2 text-sm text-gray-400">
                ({groups.length} groups, {affiliations.length} memberships)
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <SortableTable<AffiliationGroup>
              columns={columns}
              data={filtered}
              defaultSortField="totalMembers"
              defaultSortDirection="desc"
              rowKey={(row) => row.groupName}
              maxHeight="700px"
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default AffiliationsPage
