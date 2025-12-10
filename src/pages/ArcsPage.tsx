import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SortingState, PaginationState } from '@tanstack/react-table'
import ArcTable from '../components/ArcTable'
import { fetchArcs } from '../services/arcService'

function ArcsPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15, // Show 15 arcs per page
  })

  // Use React Query to fetch and cache arcs
  const { data: arcs = [], isLoading } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  return (
    <main className="container mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Story Arcs</h2>
      <p className="text-xl text-gray-600 mb-8">
        Follow the journey through each saga and arc of One Piece.
      </p>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading arcs...</p>
        </div>
      ) : (
        <>
          {/* Search Box */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by arc or saga name..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Arc Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <ArcTable
              arcs={arcs}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
        </>
      )}
    </main>
  )
}

export default ArcsPage
