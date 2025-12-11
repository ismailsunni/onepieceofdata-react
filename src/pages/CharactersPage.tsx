import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SortingState, PaginationState } from '@tanstack/react-table'
import CharacterTable from '../components/CharacterTable'
import { fetchCharacters } from '../services/characterService'
import { fetchArcs } from '../services/arcService'

function CharactersPage() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'appearance_count', desc: true }, // Sort by most appearances by default
  ])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15, // Show 15 characters per page
  })

  // Use React Query to fetch and cache characters
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  // Fetch arcs to map arc IDs to names
  const { data: arcs = [], isLoading: arcsLoading } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Characters</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Characters</h1>
          <p className="text-lg text-gray-600">
            Explore the vast world of One Piece characters
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search characters by name…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>
        </div>

        {/* Loading State with Skeleton */}
        {isLoading || arcsLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'Origin', 'Status', 'Appearances', 'First Appearance', 'Bounty', 'Age', 'Blood Type'].map((header) => (
                      <th key={header} className="px-4 py-3 text-left">
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="bg-white">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Character Table */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <CharacterTable
              characters={characters}
              arcs={arcs}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default CharactersPage
