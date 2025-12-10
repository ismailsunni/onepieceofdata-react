import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SortingState, PaginationState } from '@tanstack/react-table'
import VolumeTable from '../components/VolumeTable'
import { fetchVolumes } from '../services/volumeService'

function VolumesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20, // Show 20 volumes per page
  })

  // Use React Query to fetch and cache volumes
  const { data: volumes = [], isLoading } = useQuery({
    queryKey: ['volumes'],
    queryFn: fetchVolumes,
  })

  return (
    <main className="container mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Volumes</h2>
      <p className="text-xl text-gray-600 mb-8">
        Explore all One Piece manga volumes.
      </p>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading volumes...</p>
        </div>
      ) : (
        <>
          {/* Search Box */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by volume number or title..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Volume Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <VolumeTable
              volumes={volumes}
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

export default VolumesPage
