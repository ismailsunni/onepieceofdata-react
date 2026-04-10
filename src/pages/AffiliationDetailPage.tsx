import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAllAffiliations } from '../services/affiliationService'
import { fetchCharacters } from '../services/characterService'
import SortableTable, { Column } from '../components/common/SortableTable'
import { Character } from '../types/character'

const formatBounty = (bounty: number | null) => {
  if (!bounty) return null
  if (bounty >= 1_000_000_000) return `${(bounty / 1_000_000_000).toFixed(1)}B`
  if (bounty >= 1_000_000) return `${(bounty / 1_000_000).toFixed(0)}M`
  if (bounty >= 1_000) return `${(bounty / 1_000).toFixed(0)}K`
  return bounty.toLocaleString()
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    current: 'bg-emerald-100 text-emerald-700',
    former: 'bg-gray-100 text-gray-600',
    defected: 'bg-red-100 text-red-700',
    undercover: 'bg-amber-100 text-amber-700',
    'double agent': 'bg-amber-100 text-amber-700',
    espionage: 'bg-amber-100 text-amber-700',
    temporary: 'bg-blue-100 text-blue-600',
    disbanded: 'bg-gray-100 text-gray-500',
    dissolved: 'bg-gray-100 text-gray-500',
    retired: 'bg-gray-100 text-gray-500',
    resigned: 'bg-gray-100 text-gray-500',
    secret: 'bg-violet-100 text-violet-700',
  }
  return styles[status] || 'bg-gray-100 text-gray-600'
}

interface MemberRow {
  id: string
  name: string
  status: string
  memberStatus: string
  subGroup: string | null
  bounty: number | null
  appearances: number | null
}

function AffiliationDetailPage() {
  const { groupName } = useParams<{ groupName: string }>()
  const decodedName = groupName ? decodeURIComponent(groupName) : ''

  const { data: allAffiliations = [], isLoading: loadingAff } = useQuery({
    queryKey: ['all-affiliations'],
    queryFn: fetchAllAffiliations,
    staleTime: 10 * 60 * 1000,
  })

  const { data: characters = [], isLoading: loadingChars } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  const members = useMemo(() => {
    const charMap = new Map<string, Character>()
    for (const c of characters) charMap.set(c.id, c)

    return allAffiliations
      .filter((a) => a.group_name === decodedName)
      .map((a): MemberRow => {
        const char = charMap.get(a.character_id)
        return {
          id: a.character_id,
          name: char?.name || a.character_id,
          status: char?.status || 'Unknown',
          memberStatus: a.status,
          subGroup: a.sub_group,
          bounty: char?.bounty ?? null,
          appearances: char?.appearance_count ?? null,
        }
      })
  }, [allAffiliations, characters, decodedName])

  const subGroups = useMemo(
    () => [...new Set(members.map((m) => m.subGroup).filter(Boolean))],
    [members]
  )

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of members) {
      counts.set(m.memberStatus, (counts.get(m.memberStatus) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [members])

  const isLoading = loadingAff || loadingChars

  const columns: Column<MemberRow>[] = [
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
      key: 'memberStatus',
      label: 'Membership',
      sortValue: (row) => row.memberStatus,
      render: (row) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(row.memberStatus)}`}
        >
          {row.memberStatus}
        </span>
      ),
    },
    {
      key: 'subGroup',
      label: 'Sub-group',
      sortValue: (row) => row.subGroup || '',
      render: (row) =>
        row.subGroup ? (
          <span className="text-sm text-gray-600">{row.subGroup}</span>
        ) : (
          <span className="text-gray-300">&ndash;</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      sortValue: (row) => row.status,
      render: (row) => (
        <span
          className={`text-sm font-medium ${
            row.status === 'Alive'
              ? 'text-emerald-600'
              : row.status === 'Deceased'
                ? 'text-red-600'
                : 'text-gray-500'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'bounty',
      label: 'Bounty',
      sortValue: (row) => row.bounty ?? 0,
      render: (row) =>
        row.bounty ? (
          <span className="font-medium text-amber-600">
            {formatBounty(row.bounty)}
          </span>
        ) : (
          <span className="text-gray-300">&ndash;</span>
        ),
    },
    {
      key: 'appearances',
      label: 'Appearances',
      sortValue: (row) => row.appearances ?? 0,
      render: (row) =>
        row.appearances ? (
          <span className="text-gray-700">{row.appearances}</span>
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
          <ChevronRight />
          <Link
            to="/affiliations"
            className="hover:text-gray-900 transition-colors"
          >
            Affiliations
          </Link>
          <ChevronRight />
          <span className="text-gray-900 font-medium">{decodedName}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {decodedName}
          </h1>
          {!isLoading && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-600">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
              {statusCounts.map(([status, count]) => (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(status)}`}
                >
                  {count} {status}
                </span>
              ))}
              {subGroups.length > 0 && (
                <span className="text-gray-400">
                  {subGroups.length} sub-group
                  {subGroups.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
            No members found for this group.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <SortableTable<MemberRow>
              columns={columns}
              data={members}
              defaultSortField="name"
              defaultSortDirection="asc"
              rowKey={(row) => `${row.id}-${row.memberStatus}`}
              maxHeight="700px"
            />
          </div>
        )}
      </div>
    </main>
  )
}

function ChevronRight() {
  return (
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
  )
}

export default AffiliationDetailPage
