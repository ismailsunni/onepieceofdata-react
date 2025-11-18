import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { Arc } from '../types/arc'
import { Character } from '../types/character'

// Service function to fetch a single arc by ID
async function fetchArcById(id: string): Promise<Arc | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('arc')
      .select('*, saga:saga_id(title)')
      .eq('arc_id', id)
      .single()

    if (error) {
      console.error('Error fetching arc:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in fetchArcById:', error)
    return null
  }
}

// Service function to fetch characters that appear in this arc
async function fetchCharactersByArc(arcId: string): Promise<Character[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    // Get characters whose arc_list contains this arc
    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('arc_list', [arcId])
      .order('first_appearance', { ascending: true })

    if (error) {
      console.error('Error fetching characters by arc:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchCharactersByArc:', error)
    return []
  }
}

function ArcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: arc, isLoading: arcLoading } = useQuery({
    queryKey: ['arc', id],
    queryFn: () => fetchArcById(id!),
    enabled: !!id,
  })

  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ['arc-characters', arc?.arc_id],
    queryFn: () => fetchCharactersByArc(arc!.arc_id),
    enabled: !!arc,
  })

  if (arcLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </main>
    )
  }

  if (!arc) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Arc Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The arc you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={() => navigate('/arcs')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Arcs
          </button>
        </div>
      </main>
    )
  }

  // Calculate arc statistics
  const chapterCount = arc.end_chapter - arc.start_chapter + 1
  const chapterRange = `${arc.start_chapter}-${arc.end_chapter}`

  // Convert arc ID to wiki URL format
  const wikiName = arc.title.replace(/ /g, '_')
  const wikiUrl = `https://onepiece.fandom.com/wiki/${wikiName}`

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to="/arcs" className="hover:text-blue-600 transition-colors">
          Arcs
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{arc.title}</span>
      </nav>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/arcs')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <span>←</span>
          <span>Back to Arcs</span>
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
        <div className="bg-linear-to-r from-purple-600 to-purple-800 text-white p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{arc.title}</h1>
              {arc.japanese_title && (
                <p className="text-xl opacity-90 mb-1">{arc.japanese_title}</p>
              )}
              {arc.romanized_title && (
                <p className="text-lg opacity-75">{arc.romanized_title}</p>
              )}
              {arc.saga && (
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium text-white">
                    {arc.saga.title} Saga
                  </span>
                </div>
              )}
            </div>
            <div className="text-right ml-4">
              <div className="text-sm opacity-90">Chapters</div>
              <div className="text-3xl font-bold">{chapterCount}</div>
              <div className="text-sm opacity-75 mt-1">{chapterRange}</div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-8">
          {/* Arc Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Arc Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailRow label="Arc ID" value={arc.arc_id} />
              <DetailRow label="Saga" value={arc.saga?.title} />
              <DetailRow label="Start Chapter" value={arc.start_chapter.toString()} />
              <DetailRow label="End Chapter" value={arc.end_chapter.toString()} />
              <DetailRow label="Total Chapters" value={chapterCount.toString()} />
              <DetailRow label="Chapter Range" value={chapterRange} />
            </div>
          </div>

          {/* Description */}
          {arc.description && (
            <div className="border-t pt-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Description
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {arc.description}
                </p>
              </div>
            </div>
          )}

          {/* Characters Introduced */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Characters Appearing in This Arc
              {characters.length > 0 && (
                <span className="ml-2 text-lg text-gray-500">
                  ({characters.length})
                </span>
              )}
            </h2>

            {charactersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : characters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {characters.map((character) => (
                  <Link
                    key={character.id}
                    to={`/characters/${character.id}`}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex flex-col h-full">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                        {character.name || 'Unknown'}
                      </h3>
                      <div className="flex-1 space-y-1 text-sm text-gray-600">
                        {character.status && (
                          <p>
                            <span className="font-medium">Status:</span>{' '}
                            {character.status}
                          </p>
                        )}
                        {character.first_appearance && (
                          <p>
                            <span className="font-medium">Debut:</span> Ch.{' '}
                            {character.first_appearance}
                          </p>
                        )}
                        {character.bounty !== null && character.bounty > 0 && (
                          <p>
                            <span className="font-medium">Bounty:</span> ₿
                            {character.bounty.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 text-xs text-blue-600 font-medium">
                        View Details →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <p>No characters found appearing in this arc.</p>
              </div>
            )}
          </div>
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
          <span>Share this arc</span>
        </button>
      </div>
    </main>
  )
}

// Helper component for detail rows
function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-800">{value || 'N/A'}</span>
    </div>
  )
}

export default ArcDetailPage
