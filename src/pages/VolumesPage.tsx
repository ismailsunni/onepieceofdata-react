import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchVolumes } from '../services/volumeService'

function VolumesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  // Use React Query to fetch and cache volumes
  const { data: volumes = [], isLoading } = useQuery({
    queryKey: ['volumes'],
    queryFn: fetchVolumes,
  })

  // Filter volumes based on search
  const filteredVolumes = volumes.filter((volume) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      volume.number.toString().includes(searchLower) ||
      (volume.title && volume.title.toLowerCase().includes(searchLower))
    )
  })

  return (
    <main className="container mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-6">Volumes</h2>
      <p className="text-xl text-gray-600 mb-8">
        Explore all One Piece manga volumes.
      </p>

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by volume number or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Volume Count */}
          <div className="mb-4 text-gray-600">
            Showing {filteredVolumes.length} of {volumes.length} volumes
          </div>

          {/* Volume Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredVolumes.map((volume) => (
              <Link
                key={volume.number}
                to={`/volumes/${volume.number}`}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-orange-500 transition-all cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2 group-hover:text-orange-700">
                    {volume.number}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">VOLUME</div>
                  {volume.title && (
                    <div className="text-sm text-gray-700 line-clamp-2 mt-2">
                      {volume.title}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results */}
          {filteredVolumes.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">
                No volumes found matching "{searchTerm}"
              </p>
            </div>
          )}
        </>
      )}
    </main>
  )
}

export default VolumesPage
