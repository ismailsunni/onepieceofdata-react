import { useState } from 'react'
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
    <main className="container mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Characters</h2>
      <p className="text-xl text-gray-600 mb-8">
        Explore the vast world of One Piece characters.
      </p>

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {isLoading || arcsLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading characters...</p>
        </div>
      ) : (
        /* Character Table */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
    </main>
  )
}

export default CharactersPage
