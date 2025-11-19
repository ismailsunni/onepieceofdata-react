import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SortingState, PaginationState } from '@tanstack/react-table'
import SagaTable from '../components/SagaTable'
import { fetchSagas } from '../services/sagaService'

function SagasPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15, // Show 15 sagas per page
  })

  // Use React Query to fetch and cache sagas
  const { data: sagas = [], isLoading } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
  })

  return (
    <main className="container mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Sagas</h2>
      <p className="text-xl text-gray-600 mb-8">
        Explore the major story sagas that make up the One Piece adventure.
      </p>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading sagas...</p>
        </div>
      ) : (
        <>
          {/* Search Box */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by saga name..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Saga Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <SagaTable
              sagas={sagas}
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

export default SagasPage
