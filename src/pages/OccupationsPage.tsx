import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAllOccupations } from '../services/occupationService'
import { fetchCharacters } from '../services/characterService'
import SortableTable, { Column } from '../components/common/SortableTable'
import { Character } from '../types/character'

interface ExampleHolder {
  id: string
  name: string
  appearances: number
  isCurrent: boolean
}

interface OccupationGroup {
  role: string
  totalHolders: number
  currentHolders: number
  formerHolders: number
  statuses: string[]
  examples: ExampleHolder[]
}

const MAX_EXAMPLES = 3

function OccupationsPage() {
  const [search, setSearch] = useState('')

  const { data: occupations = [], isLoading: loadingOcc } = useQuery({
    queryKey: ['all-occupations'],
    queryFn: fetchAllOccupations,
    staleTime: 10 * 60 * 1000,
  })

  const { data: characters = [], isLoading: loadingChars } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  const isLoading = loadingOcc || loadingChars

  const groups = useMemo(() => {
    const charMap = new Map<string, Character>()
    for (const c of characters) charMap.set(c.id, c)

    const map = new Map<string, OccupationGroup>()

    for (const occ of occupations) {
      const char = charMap.get(occ.character_id)
      const holder: ExampleHolder = {
        id: occ.character_id,
        name: char?.name || occ.character_id,
        appearances: char?.appearance_count ?? 0,
        isCurrent: occ.status === 'current',
      }

      const existing = map.get(occ.role)
      if (existing) {
        existing.totalHolders++
        if (occ.status === 'current') existing.currentHolders++
        if (occ.status === 'former' || occ.status === 'defected')
          existing.formerHolders++
        if (!existing.statuses.includes(occ.status))
          existing.statuses.push(occ.status)
        existing.examples.push(holder)
      } else {
        map.set(occ.role, {
          role: occ.role,
          totalHolders: 1,
          currentHolders: occ.status === 'current' ? 1 : 0,
          formerHolders:
            occ.status === 'former' || occ.status === 'defected' ? 1 : 0,
          statuses: [occ.status],
          examples: [holder],
        })
      }
    }

    // Rank examples: current first, then by appearances desc, then by name
    for (const g of map.values()) {
      g.examples.sort((a, b) => {
        if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1
        if (b.appearances !== a.appearances)
          return b.appearances - a.appearances
        return a.name.localeCompare(b.name)
      })
      g.examples = g.examples.slice(0, MAX_EXAMPLES)
    }

    return Array.from(map.values())
  }, [occupations, characters])

  const filtered = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.toLowerCase()
    return groups.filter((g) => g.role.toLowerCase().includes(q))
  }, [groups, search])

  const columns: Column<OccupationGroup>[] = [
    {
      key: 'role',
      label: 'Occupation / Role',
      sortValue: (row) => row.role,
      render: (row) => (
        <Link
          to={`/occupations/${encodeURIComponent(row.role)}`}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {row.role}
        </Link>
      ),
    },
    {
      key: 'totalHolders',
      label: 'Holders',
      sortValue: (row) => row.totalHolders,
      render: (row) => (
        <span className="font-semibold text-gray-900">{row.totalHolders}</span>
      ),
    },
    {
      key: 'currentHolders',
      label: 'Current',
      sortValue: (row) => row.currentHolders,
      render: (row) => (
        <span className="text-emerald-600 font-medium">
          {row.currentHolders}
        </span>
      ),
    },
    {
      key: 'formerHolders',
      label: 'Former / Defected',
      sortValue: (row) => row.formerHolders,
      render: (row) => (
        <span className="text-gray-500">{row.formerHolders}</span>
      ),
    },
    {
      key: 'examples',
      label: 'Examples',
      sortable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.examples.map((ex) => (
            <Link
              key={ex.id}
              to={`/characters/${ex.id}`}
              onClick={(e) => e.stopPropagation()}
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                ex.isCurrent
                  ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ex.name}
            </Link>
          ))}
          {row.totalHolders > row.examples.length && (
            <span className="text-xs text-gray-400 self-center">
              +{row.totalHolders - row.examples.length} more
            </span>
          )}
        </div>
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
          <span className="text-gray-900 font-medium">Occupations</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Occupations</h1>
          <p className="text-lg text-gray-600">
            All roles and occupations held by characters in the One Piece world
            {groups.length > 0 && (
              <span className="ml-2 text-sm text-gray-400">
                ({groups.length} roles, {occupations.length} assignments)
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
              placeholder="Search occupations..."
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
            <SortableTable<OccupationGroup>
              columns={columns}
              data={filtered}
              defaultSortField="totalHolders"
              defaultSortDirection="desc"
              rowKey={(row) => row.role}
              maxHeight="700px"
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default OccupationsPage
