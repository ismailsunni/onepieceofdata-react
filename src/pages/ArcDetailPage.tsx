import { useState } from 'react'
import { logger } from '../utils/logger'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faLink, faCheck, faExternalLinkAlt, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { supabase } from '../services/supabase'
import { Arc } from '../types/arc'
import { Character } from '../types/character'
import { Chapter } from '../types/chapter'
import { fetchArcs } from '../services/arcService'

// Service functions
async function fetchArcById(id: string): Promise<Arc | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('arc')
      .select('*, saga:saga_id(title)')
      .eq('arc_id', id)
      .single()

    if (error) {
      logger.error('Error fetching arc:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchArcById:', error)
    return null
  }
}

async function fetchChaptersByArc(startChapter: number, endChapter: number): Promise<Chapter[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('chapter')
      .select('*')
      .gte('number', startChapter)
      .lte('number', endChapter)
      .order('number', { ascending: true })

    if (error) {
      logger.error('Error fetching chapters by arc:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchChaptersByArc:', error)
    return []
  }
}

async function fetchCharactersByArc(arcId: string): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('arc_list', [arcId])
      .order('first_appearance', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by arc:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersByArc:', error)
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

function Tag({
  children,
  to
}: {
  children: React.ReactNode
  to?: string
}) {
  const className = 'inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors bg-purple-50 text-purple-700 hover:bg-purple-100'

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

  return <span className={className}>{children}</span>
}

function ArcDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showAllChapters, setShowAllChapters] = useState(false)
  const [showAllCharacters, setShowAllCharacters] = useState(false)
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false)

  const { data: arc, isLoading: arcLoading } = useQuery({
    queryKey: ['arc', id],
    queryFn: () => fetchArcById(id!),
    enabled: !!id,
  })

  const { data: chapters = [] } = useQuery({
    queryKey: ['arc-chapters', arc?.start_chapter, arc?.end_chapter],
    queryFn: () => fetchChaptersByArc(arc!.start_chapter, arc!.end_chapter),
    enabled: !!arc,
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['arc-characters', arc?.arc_id],
    queryFn: () => fetchCharactersByArc(arc!.arc_id),
    enabled: !!arc,
  })

  const { data: allArcs = [] } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  const sortedArcs = [...allArcs].sort((a, b) => a.start_chapter - b.start_chapter)
  const currentIndex = sortedArcs.findIndex((a) => a.arc_id === arc?.arc_id)
  const previousArc = currentIndex > 0 ? sortedArcs[currentIndex - 1] : null
  const nextArc = currentIndex < sortedArcs.length - 1 ? sortedArcs[currentIndex + 1] : null

  const handleRandomArc = () => {
    if (allArcs.length > 0) {
      const randomArc = allArcs[Math.floor(Math.random() * allArcs.length)]
      navigate(`/arcs/${randomArc.arc_id}`)
    }
  }

  if (arcLoading) {
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

  if (!arc) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Arc Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The arc you're looking for doesn't exist or couldn't be loaded.
            </p>
            <button
              onClick={() => navigate('/arcs')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Arcs
            </button>
          </Card>
        </div>
      </main>
    )
  }

  const chapterCount = arc.end_chapter - arc.start_chapter + 1
  const chapterRange = `${arc.start_chapter}-${arc.end_chapter}`

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopyLinkFeedback(true)
      setTimeout(() => setCopyLinkFeedback(false), 2000)
    })
  }

  const handleShareToTwitter = () => {
    const text = `Check out the ${arc.title} arc from One Piece!`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const wikiName = arc.title.replace(/ /g, '_')
  const wikiUrl = `https://onepiece.fandom.com/wiki/${wikiName}`

  const displayedChapters = showAllChapters ? chapters : chapters.slice(0, 12)
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
          <Link to="/arcs" className="hover:text-gray-900 transition-colors">
            Arcs
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{arc.title}</span>
        </nav>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/arcs')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
            title="Back to Arcs"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => previousArc && navigate(`/arcs/${previousArc.arc_id}`)}
              disabled={!previousArc}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title={previousArc ? `Previous: ${previousArc.title}` : 'No previous arc'}
            >
              <span className="hidden md:inline text-sm font-medium">Prev</span>
              <span className="md:hidden text-sm font-medium">‹</span>
            </button>

            <button
              onClick={handleRandomArc}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm"
              title="Random Arc"
            >
              <span className="text-sm font-medium">Random</span>
            </button>

            <button
              onClick={() => nextArc && navigate(`/arcs/${nextArc.arc_id}`)}
              disabled={!nextArc}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title={nextArc ? `Next: ${nextArc.title}` : 'No next arc'}
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
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 opacity-60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>

          <Card className="relative border-2 border-emerald-100">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-block mb-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
                    {arc.title}
                  </h1>
                  <div className="h-1 w-32 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"></div>
                </div>
                {arc.japanese_title && (
                  <p className="text-lg text-gray-600 mb-1">{arc.japanese_title}</p>
                )}
                {arc.romanized_title && (
                  <p className="text-base text-gray-500 mb-4">{arc.romanized_title}</p>
                )}
                {arc.saga && arc.saga_id && (
                  <div className="flex flex-wrap gap-2">
                    <Tag to={`/sagas/${arc.saga_id}`}>
                      {arc.saga.title} Saga
                    </Tag>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Chapters</div>
                </div>
                <div className="text-4xl font-bold text-emerald-900">{chapterCount}</div>
                <div className="text-xs text-emerald-700 mt-1">{chapterRange}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Arc Information */}
        <Card className="mb-8 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <SectionTitle>Arc Information</SectionTitle>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Arc ID</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{arc.arc_id}</dd>
            </div>
            {arc.saga && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Saga</dt>
                <dd className="text-sm text-right ml-4">
                  <Link to={`/sagas/${arc.saga_id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                    {arc.saga.title}
                  </Link>
                </dd>
              </div>
            )}
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Start Chapter</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{arc.start_chapter}</dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">End Chapter</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{arc.end_chapter}</dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Total Chapters</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{chapterCount}</dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Chapter Range</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{chapterRange}</dd>
            </div>
          </dl>

          {arc.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {arc.description}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Chapters */}
        {chapters.length > 0 && (
          <Card className="mb-8 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <SectionTitle>
                  Chapters in This Arc
                  <span className="ml-2 text-base text-gray-500">({chapters.length})</span>
                </SectionTitle>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedChapters.map((chapter) => (
                <Link
                  key={chapter.number}
                  to={`/chapters/${chapter.number}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        Chapter {chapter.number}
                      </h3>
                      {chapter.num_page && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full whitespace-nowrap">
                          {chapter.num_page} pages
                        </span>
                      )}
                    </div>
                    {chapter.title && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {chapter.title}
                      </p>
                    )}
                    <div className="mt-auto text-xs text-blue-600 font-medium">
                      View Details →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {chapters.length > 12 && (
              <button
                onClick={() => setShowAllChapters(!showAllChapters)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors border border-green-200"
              >
                <span>{showAllChapters ? 'Show Less' : `Show ${chapters.length - 12} More Chapters`}</span>
                <FontAwesomeIcon icon={showAllChapters ? faChevronUp : faChevronDown} className="w-3 h-3" />
              </button>
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

export default ArcDetailPage
