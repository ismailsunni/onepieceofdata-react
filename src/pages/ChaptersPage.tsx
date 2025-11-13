import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SortingState, PaginationState } from '@tanstack/react-table'
import ChapterTable from '../components/ChapterTable'
import { fetchChapters } from '../services/chapterService'

function ChaptersPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20, // Show 20 chapters per page
  })

  // Use React Query to fetch and cache chapters
  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['chapters'],
    queryFn: fetchChapters,
  })

  return (
    <main className="container mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Chapters</h2>
      <p className="text-xl text-gray-600 mb-8">
        Explore all One Piece manga chapters with release dates and character appearances.
      </p>

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by chapter number or title..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading chapters...</p>
        </div>
      ) : (
        /* Chapter Table */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ChapterTable
            chapters={chapters}
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

export default ChaptersPage
