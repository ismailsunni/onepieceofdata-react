import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { Character } from '../types/character'

// Service function to fetch a single character by ID
async function fetchCharacterById(id: string): Promise<Character | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching character:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in fetchCharacterById:', error)
    return null
  }
}

function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: character, isLoading, error } = useQuery({
    queryKey: ['character', id],
    queryFn: () => fetchCharacterById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </main>
    )
  }

  if (error || !character) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Character Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The character you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={() => navigate('/characters')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Characters
          </button>
        </div>
      </main>
    )
  }

  // Convert character ID to wiki URL format
  const wikiName = character.id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_')
  const wikiUrl = `https://onepiece.fandom.com/wiki/${wikiName}`

  // Format bounty
  const formatBounty = (bounty: number | null) => {
    if (!bounty) return 'Unknown'
    if (bounty === 0) return 'None'
    return `₿${bounty.toLocaleString()}`
  }

  // Status badge color
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'alive':
        return 'bg-green-100 text-green-800'
      case 'deceased':
        return 'bg-red-100 text-red-800'
      case 'unknown':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to="/characters" className="hover:text-blue-600 transition-colors">
          Characters
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{character.name || 'Unknown'}</span>
      </nav>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/characters')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <span>←</span>
          <span>Back to Characters</span>
        </button>
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <span>View on Wiki</span>
          <span>↗</span>
        </a>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{character.name || 'Unknown'}</h1>
              {character.status && (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(character.status)}`}>
                  {character.status}
                </span>
              )}
            </div>
            {character.bounty !== null && (
              <div className="text-right">
                <div className="text-sm opacity-90">Bounty</div>
                <div className="text-3xl font-bold">{formatBounty(character.bounty)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Basic Information</h2>
              
              <DetailRow label="ID" value={character.id} />
              <DetailRow label="Name" value={character.name} />
              <DetailRow label="Origin" value={character.origin} />
              <DetailRow label="Status" value={character.status} />
              <DetailRow label="Age" value={character.age?.toString()} />
              <DetailRow label="Birth Date" value={character.birth_date || character.birth} />
              <DetailRow label="Blood Type" value={character.blood_type} />
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Statistics</h2>
              
              <DetailRow label="Current Bounty" value={formatBounty(character.bounty)} />
              <DetailRow label="Bounty History" value={character.bounties} />
              <DetailRow label="First Appearance" value={character.first_appearance ? `Chapter ${character.first_appearance}` : null} />
              <DetailRow label="Last Appearance" value={character.last_appearance ? `Chapter ${character.last_appearance}` : null} />
              <DetailRow label="Chapter Appearances" value={character.appearance_count?.toString()} />
              <DetailRow label="Volume Appearances" value={character.volume_appearance_count?.toString()} />
            </div>
          </div>

          {/* Appearance Details */}
          {(character.chapter_list || character.volume_list) && (
            <div className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Appearance Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {character.chapter_list && character.chapter_list.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      Chapters ({character.chapter_list.length})
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {character.chapter_list.slice(0, 50).map((chapter) => (
                          <span
                            key={chapter}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                          >
                            {chapter}
                          </span>
                        ))}
                        {character.chapter_list.length > 50 && (
                          <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 rounded text-sm">
                            +{character.chapter_list.length - 50} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {character.volume_list && character.volume_list.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                      Volumes ({character.volume_list.length})
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {character.volume_list.map((volume) => (
                          <span
                            key={volume}
                            className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                          >
                            Vol. {volume}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Quality Note */}
          {character.scraping_status && (
            <div className="border-t pt-8 mt-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Data Information</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Scraping Status:</span> {character.scraping_status}
                </p>
                {character.scraping_note && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Note:</span> {character.scraping_note}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Section */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard!')
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <span>🔗</span>
          <span>Share this character</span>
        </button>
      </div>
    </main>
  )
}

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-800">{value || 'N/A'}</span>
    </div>
  )
}

export default CharacterDetailPage
