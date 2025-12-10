import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabase'
import { Saga, Arc } from '../types/arc'
import { Character } from '../types/character'

// Service function to fetch a single saga by ID
async function fetchSagaById(id: string): Promise<Saga | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('saga')
      .select('*')
      .eq('saga_id', id)
      .single()

    if (error) {
      console.error('Error fetching saga:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in fetchSagaById:', error)
    return null
  }
}

// Service function to fetch arcs in this saga
async function fetchArcsBySaga(sagaId: string): Promise<Arc[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('arc')
      .select('*')
      .eq('saga_id', sagaId)
      .order('start_chapter', { ascending: true })

    if (error) {
      console.error('Error fetching arcs by saga:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchArcsBySaga:', error)
    return []
  }
}

// Service function to fetch characters that appear in this saga
async function fetchCharactersBySaga(sagaId: string): Promise<Character[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    // Get characters whose saga_list contains this saga
    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('saga_list', [sagaId])
      .order('first_appearance', { ascending: true })

    if (error) {
      console.error('Error fetching characters by saga:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchCharactersBySaga:', error)
    return []
  }
}

// Service function to fetch all sagas for navigation
async function fetchSagas(): Promise<Saga[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('saga')
      .select('*')
      .order('start_chapter', { ascending: true })

    if (error) {
      console.error('Error fetching sagas:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchSagas:', error)
    return []
  }
}

function SagaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isArcsExpanded, setIsArcsExpanded] = useState(true) // Arcs expanded by default
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(false)
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false)

  const { data: saga, isLoading: sagaLoading } = useQuery({
    queryKey: ['saga', id],
    queryFn: () => fetchSagaById(id!),
    enabled: !!id,
  })

  const { data: arcs = [], isLoading: arcsLoading } = useQuery({
    queryKey: ['saga-arcs', saga?.saga_id],
    queryFn: () => fetchArcsBySaga(saga!.saga_id),
    enabled: !!saga,
  })

  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ['saga-characters', saga?.saga_id],
    queryFn: () => fetchCharactersBySaga(saga!.saga_id),
    enabled: !!saga,
  })

  // Fetch all sagas for navigation
  const { data: allSagas = [] } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
  })

  // Find previous and next sagas (sorted by start_chapter)
  const sortedSagas = [...allSagas].sort((a, b) => a.start_chapter - b.start_chapter)
  const currentIndex = sortedSagas.findIndex((s) => s.saga_id === saga?.saga_id)
  const previousSaga = currentIndex > 0 ? sortedSagas[currentIndex - 1] : null
  const nextSaga = currentIndex < sortedSagas.length - 1 ? sortedSagas[currentIndex + 1] : null

  // Handler for random saga
  const handleRandomSaga = () => {
    if (allSagas.length > 0) {
      const randomSaga = allSagas[Math.floor(Math.random() * allSagas.length)]
      navigate(`/sagas/${randomSaga.saga_id}`)
    }
  }

  if (sagaLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </main>
    )
  }

  if (!saga) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Saga Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The saga you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </main>
    )
  }

  // Calculate saga statistics
  const chapterCount = saga.end_chapter - saga.start_chapter + 1
  const chapterRange = `${saga.start_chapter}-${saga.end_chapter}`

  // Copy link handler
  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopyLinkFeedback(true)
      setTimeout(() => setCopyLinkFeedback(false), 2000)
    })
  }

  // Share to Twitter handler
  const handleShareToTwitter = () => {
    const text = `Check out the ${saga.title} saga from One Piece!`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  // Convert saga ID to wiki URL format
  const wikiName = saga.title.replace(/ /g, '_')
  const wikiUrl = `https://onepiece.fandom.com/wiki/${wikiName}`

  return (
    <main className="container mx-auto px-4 py-4 md:py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 md:mb-6 text-xs md:text-sm text-gray-600">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <span className="mx-1 md:mx-2">/</span>
        <span className="text-gray-800 font-medium">{saga.title}</span>
      </nav>

      {/* Header with Navigation */}
      <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 gap-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-sm md:text-base text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
        >
          <span>←</span>
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => previousSaga && navigate(`/sagas/${previousSaga.saga_id}`)}
            disabled={!previousSaga}
            className="flex items-center gap-1 px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 cursor-pointer"
            title={previousSaga ? `Previous: ${previousSaga.title}` : 'No previous saga'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden md:inline font-medium">Prev</span>
          </button>

          <button
            onClick={handleRandomSaga}
            className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all cursor-pointer"
            title="Random Saga"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden md:inline font-medium">Random</span>
          </button>

          <button
            onClick={() => nextSaga && navigate(`/sagas/${nextSaga.saga_id}`)}
            disabled={!nextSaga}
            className="flex items-center gap-1 px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 cursor-pointer"
            title={nextSaga ? `Next: ${nextSaga.title}` : 'No next saga'}
          >
            <span className="hidden md:inline font-medium">Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center w-10 h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title={copyLinkFeedback ? 'Copied!' : 'Copy link to clipboard'}
          >
            {copyLinkFeedback ? (
              <span>✓</span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleShareToTwitter}
            className="flex items-center justify-center w-10 h-10 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            title="Share on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            title="View on Wiki"
          >
            <span>↗</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-linear-to-r from-indigo-600 to-indigo-800 text-white p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{saga.title}</h1>
              {saga.japanese_title && (
                <p className="text-lg md:text-xl opacity-90 mb-1">{saga.japanese_title}</p>
              )}
              {saga.romanized_title && (
                <p className="text-base md:text-lg opacity-75">{saga.romanized_title}</p>
              )}
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs md:text-sm opacity-90">Chapters</div>
              <div className="text-2xl md:text-3xl font-bold">{chapterCount}</div>
              <div className="text-xs md:text-sm opacity-75 mt-1">{chapterRange}</div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-4 md:p-8">
          {/* Saga Information */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
              Saga Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <DetailRow label="Saga ID" value={saga.saga_id} />
              <DetailRow label="Start Chapter" value={saga.start_chapter.toString()} />
              <DetailRow label="End Chapter" value={saga.end_chapter.toString()} />
              <DetailRow label="Total Chapters" value={chapterCount.toString()} />
              <DetailRow label="Chapter Range" value={chapterRange} />
              <DetailRow label="Number of Arcs" value={arcs.length.toString()} />
            </div>
          </div>

          {/* Description */}
          {saga.description && (
            <div className="border-t pt-6 md:pt-8 mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
                Description
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {saga.description}
                </p>
              </div>
            </div>
          )}

          {/* Arcs in this Saga */}
          <div className="border-t pt-6 md:pt-8 mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                Story Arcs in This Saga
                {arcs.length > 0 && (
                  <span className="ml-2 text-base md:text-lg text-gray-500">
                    ({arcs.length})
                  </span>
                )}
              </h2>
              {arcs.length > 0 && (
                <button
                  onClick={() => setIsArcsExpanded(!isArcsExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                >
                  <span>{isArcsExpanded ? 'Collapse' : 'Expand'}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isArcsExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {arcsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : arcs.length > 0 ? (
              <>
                {!isArcsExpanded ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-600 text-center">
                      Click "Expand" to view all {arcs.length} arcs in this saga
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {arcs.map((arc) => (
                      <Link
                        key={arc.arc_id}
                        to={`/arcs/${arc.arc_id}`}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                      >
                        <h3 className="font-semibold text-gray-800 mb-2">{arc.title}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Chapters:</span>{' '}
                            {arc.start_chapter} - {arc.end_chapter}
                          </p>
                          <p>
                            <span className="font-medium">Total:</span>{' '}
                            {arc.end_chapter - arc.start_chapter + 1} chapters
                          </p>
                        </div>
                        <div className="mt-3 text-xs text-blue-600 font-medium">
                          View Arc Details →
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <p>No arcs found in this saga.</p>
              </div>
            )}
          </div>

          {/* Characters Appearing in this Saga */}
          <div className="border-t pt-6 md:pt-8">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                Characters Appearing in This Saga
                {characters.length > 0 && (
                  <span className="ml-2 text-base md:text-lg text-gray-500">
                    ({characters.length})
                  </span>
                )}
              </h2>
              {characters.length > 0 && (
                <button
                  onClick={() => setIsCharactersExpanded(!isCharactersExpanded)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <span>{isCharactersExpanded ? 'Collapse' : 'Expand'}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isCharactersExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {charactersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : characters.length > 0 ? (
              <>
                {!isCharactersExpanded ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-600 text-center">
                      Click "Expand" to view all {characters.length} characters appearing in this saga
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {characters.map((character) => (
                      <Link
                        key={character.id}
                        to={`/characters/${character.id}`}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
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
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <p>No character data available for this saga.</p>
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <span>🔗</span>
          <span>Share this saga</span>
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

export default SagaDetailPage
