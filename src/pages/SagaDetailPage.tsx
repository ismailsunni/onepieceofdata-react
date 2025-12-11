import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faLink, faCheck, faExternalLinkAlt, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { supabase } from '../services/supabase'
import { Saga, Arc } from '../types/arc'
import { Character } from '../types/character'

// Service functions
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

async function fetchCharactersBySaga(sagaId: string): Promise<Character[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

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

// ===== REUSABLE COMPONENTS =====

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-gray-900 mb-4">
      {children}
    </h2>
  )
}

function SagaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAllArcs, setShowAllArcs] = useState(true)
  const [showAllCharacters, setShowAllCharacters] = useState(false)
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

  const { data: allSagas = [] } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
  })

  const sortedSagas = [...allSagas].sort((a, b) => a.start_chapter - b.start_chapter)
  const currentIndex = sortedSagas.findIndex((s) => s.saga_id === saga?.saga_id)
  const previousSaga = currentIndex > 0 ? sortedSagas[currentIndex - 1] : null
  const nextSaga = currentIndex < sortedSagas.length - 1 ? sortedSagas[currentIndex + 1] : null

  const handleRandomSaga = () => {
    if (allSagas.length > 0) {
      const randomSaga = allSagas[Math.floor(Math.random() * allSagas.length)]
      navigate(`/sagas/${randomSaga.saga_id}`)
    }
  }

  if (sagaLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    )
  }

  if (!saga) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Saga Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The saga you're looking for doesn't exist or couldn't be loaded.
            </p>
            <button
              onClick={() => navigate('/sagas')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Sagas
            </button>
          </Card>
        </div>
      </main>
    )
  }

  const chapterCount = saga.end_chapter - saga.start_chapter + 1
  const chapterRange = `${saga.start_chapter}-${saga.end_chapter}`

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopyLinkFeedback(true)
      setTimeout(() => setCopyLinkFeedback(false), 2000)
    })
  }

  const handleShareToTwitter = () => {
    const text = `Check out the ${saga.title} saga from One Piece!`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const wikiName = saga.title.replace(/ /g, '_')
  const wikiUrl = `https://onepiece.fandom.com/wiki/${wikiName}`

  const displayedCharacters = showAllCharacters ? characters : characters.slice(0, 12)

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
          <Link to="/sagas" className="hover:text-gray-900 transition-colors">
            Sagas
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{saga.title}</span>
        </nav>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/sagas')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
            title="Back to Sagas"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => previousSaga && navigate(`/sagas/${previousSaga.saga_id}`)}
              disabled={!previousSaga}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title={previousSaga ? `Previous: ${previousSaga.title}` : 'No previous saga'}
            >
              <span className="hidden md:inline text-sm font-medium">Prev</span>
              <span className="md:hidden text-sm font-medium">‹</span>
            </button>

            <button
              onClick={handleRandomSaga}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm"
              title="Random Saga"
            >
              <span className="text-sm font-medium">Random</span>
            </button>

            <button
              onClick={() => nextSaga && navigate(`/sagas/${nextSaga.saga_id}`)}
              disabled={!nextSaga}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title={nextSaga ? `Next: ${nextSaga.title}` : 'No next saga'}
            >
              <span className="hidden md:inline text-sm font-medium">Next</span>
              <span className="md:hidden text-sm font-medium">›</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg transition-colors shadow-sm"
              title={copyLinkFeedback ? 'Copied!' : 'Copy link'}
            >
              <FontAwesomeIcon icon={copyLinkFeedback ? faCheck : faLink} className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleShareToTwitter}
              className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg transition-colors shadow-sm"
              title="Share on Twitter"
            >
              <FontAwesomeIcon icon={faXTwitter} className="w-4 h-4 text-gray-700" />
            </button>
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg transition-colors shadow-sm"
              title="View on Wiki"
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4 h-4 text-gray-700" />
            </a>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 opacity-60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>

          <Card className="relative border-2 border-purple-100">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-block mb-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
                    {saga.title}
                  </h1>
                  <div className="h-1 w-32 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"></div>
                </div>
                {saga.japanese_title && (
                  <p className="text-lg text-gray-600 mb-1">{saga.japanese_title}</p>
                )}
                {saga.romanized_title && (
                  <p className="text-base text-gray-500">{saga.romanized_title}</p>
                )}
              </div>

              <div className="flex-shrink-0 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-sm font-semibold text-purple-800 uppercase tracking-wide">Chapters</div>
                </div>
                <div className="text-4xl font-bold text-purple-900">{chapterCount}</div>
                <div className="text-xs text-purple-700 mt-1">{chapterRange}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Saga Information */}
        <Card className="mb-8 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <SectionTitle>Saga Information</SectionTitle>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Saga ID</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{saga.saga_id}</dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Start Chapter</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{saga.start_chapter}</dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">End Chapter</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{saga.end_chapter}</dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Total Chapters</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{chapterCount}</dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Chapter Range</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{chapterRange}</dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Number of Arcs</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{arcs.length}</dd>
            </div>
          </dl>

          {saga.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {saga.description}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Story Arcs */}
        {arcs.length > 0 && (
          <Card className="mb-8 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <SectionTitle>
                  Story Arcs in This Saga
                  <span className="ml-2 text-base text-gray-500">({arcs.length})</span>
                </SectionTitle>
              </div>
              {arcs.length > 0 && (
                <button
                  onClick={() => setShowAllArcs(!showAllArcs)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors border border-purple-200"
                >
                  <span>{showAllArcs ? 'Collapse' : 'Expand'}</span>
                  <FontAwesomeIcon icon={showAllArcs ? faChevronUp : faChevronDown} className="w-3 h-3" />
                </button>
              )}
            </div>

            {showAllArcs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {arcs.map((arc) => (
                  <Link
                    key={arc.arc_id}
                    to={`/arcs/${arc.arc_id}`}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <h3 className="font-semibold text-gray-800 mb-2">{arc.title}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Chapters:</span> {arc.start_chapter} - {arc.end_chapter}
                      </p>
                      <p>
                        <span className="font-medium">Total:</span> {arc.end_chapter - arc.start_chapter + 1} chapters
                      </p>
                    </div>
                    <div className="mt-3 text-xs text-blue-600 font-medium">
                      View Arc Details →
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-600 text-center">
                  Click "Expand" to view all {arcs.length} arcs in this saga
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Characters */}
        {characters.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <SectionTitle>
                  Characters Appearing
                  <span className="ml-2 text-base text-gray-500">({characters.length})</span>
                </SectionTitle>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedCharacters.map((character) => (
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
                          <span className="font-medium">Status:</span> {character.status}
                        </p>
                      )}
                      {character.first_appearance && (
                        <p>
                          <span className="font-medium">Debut:</span> Ch. {character.first_appearance}
                        </p>
                      )}
                      {character.bounty !== null && character.bounty > 0 && (
                        <p>
                          <span className="font-medium">Bounty:</span> ₿{character.bounty.toLocaleString()}
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
            {characters.length > 12 && (
              <button
                onClick={() => setShowAllCharacters(!showAllCharacters)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors border border-blue-200"
              >
                <span>{showAllCharacters ? 'Show Less' : `Show ${characters.length - 12} More Characters`}</span>
                <FontAwesomeIcon icon={showAllCharacters ? faChevronUp : faChevronDown} className="w-3 h-3" />
              </button>
            )}
          </Card>
        )}
      </div>
    </main>
  )
}

export default SagaDetailPage
