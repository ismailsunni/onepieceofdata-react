import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faLink, faCheck, faExternalLinkAlt, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { supabase } from '../services/supabase'
import { Chapter } from '../types/chapter'
import { Character } from '../types/character'
import { Arc } from '../types/arc'
import { fetchChapters } from '../services/chapterService'

// Service function to fetch a single chapter by number
async function fetchChapterByNumber(chapterNumber: number): Promise<Chapter | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('chapter')
      .select('*')
      .eq('number', chapterNumber)
      .single()

    if (error) {
      console.error('Error fetching chapter:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in fetchChapterByNumber:', error)
    return null
  }
}

// Service function to fetch characters that appear in this chapter
async function fetchCharactersByChapter(chapterNumber: number): Promise<Character[]> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('chapter_list', [chapterNumber])
      .order('first_appearance', { ascending: true })

    if (error) {
      console.error('Error fetching characters by chapter:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchCharactersByChapter:', error)
    return []
  }
}

// Service function to fetch arc for this chapter
async function fetchArcByChapter(chapterNumber: number): Promise<Arc | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('arc')
      .select('*, saga:saga_id(title)')
      .lte('start_chapter', chapterNumber)
      .gte('end_chapter', chapterNumber)
      .single()

    if (error) {
      console.error('Error fetching arc by chapter:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in fetchArcByChapter:', error)
    return null
  }
}

// ===== REUSABLE COMPONENTS =====

// Card component wrapper
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  )
}

// SectionTitle component
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-gray-900 mb-4">
      {children}
    </h2>
  )
}

// Tag component
function Tag({
  children,
  to,
  variant = 'default'
}: {
  children: React.ReactNode
  to?: string
  variant?: 'saga' | 'arc' | 'default'
}) {
  const variantStyles = {
    saga: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    arc: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    default: 'bg-gray-50 text-gray-700 hover:bg-gray-100'
  }

  const className = `inline-block px-3 py-1 rounded-full text-sm font-medium transition-colors ${variantStyles[variant]}`

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

  return <span className={className}>{children}</span>
}

function ChapterDetailPage() {
  const { number } = useParams<{ number: string }>()
  const navigate = useNavigate()
  const chapterNumber = number ? parseInt(number, 10) : null
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false)
  const [showAllCharacters, setShowAllCharacters] = useState(false)

  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ['chapter', chapterNumber],
    queryFn: () => fetchChapterByNumber(chapterNumber!),
    enabled: !!chapterNumber,
  })

  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ['chapter-characters', chapterNumber],
    queryFn: () => fetchCharactersByChapter(chapterNumber!),
    enabled: !!chapterNumber,
  })

  const { data: arc } = useQuery({
    queryKey: ['chapter-arc', chapterNumber],
    queryFn: () => fetchArcByChapter(chapterNumber!),
    enabled: !!chapterNumber,
  })

  const { data: allChapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: fetchChapters,
  })

  const handleRandomChapter = () => {
    if (allChapters.length > 0) {
      const randomChapter = allChapters[Math.floor(Math.random() * allChapters.length)]
      navigate(`/chapters/${randomChapter.number}`)
    }
  }

  if (chapterLoading) {
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

  if (!chapter) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Chapter Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The chapter you're looking for doesn't exist or couldn't be loaded.
            </p>
            <button
              onClick={() => navigate('/chapters')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Chapters
            </button>
          </Card>
        </div>
      </main>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopyLinkFeedback(true)
      setTimeout(() => setCopyLinkFeedback(false), 2000)
    })
  }

  const handleShareToTwitter = () => {
    const text = `Check out Chapter ${chapter.number}${chapter.title ? `: ${chapter.title}` : ''} from One Piece!`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const wikiUrl = `https://onepiece.fandom.com/wiki/Chapter_${chapter.number}`

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
          <Link to="/chapters" className="hover:text-gray-900 transition-colors">
            Chapters
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Chapter {chapter.number}</span>
        </nav>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/chapters')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
            title="Back to Chapters"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/chapters/${chapter.number - 1}`)}
              disabled={chapter.number <= 1}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title="Previous Chapter"
            >
              <span className="hidden md:inline text-sm font-medium">Prev</span>
              <span className="md:hidden text-sm font-medium">‹</span>
            </button>

            <button
              onClick={handleRandomChapter}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm"
              title="Random Chapter"
            >
              <span className="text-sm font-medium">Random</span>
            </button>

            <button
              onClick={() => navigate(`/chapters/${chapter.number + 1}`)}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all shadow-sm"
              title="Next Chapter"
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
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 opacity-60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>

          <Card className="relative border-2 border-emerald-100">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-block mb-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
                    Chapter {chapter.number}
                  </h1>
                  <div className="h-1 w-32 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"></div>
                </div>
                {chapter.title && (
                  <p className="text-xl text-gray-700 font-medium mb-4">{chapter.title}</p>
                )}
                {arc && (
                  <div className="flex flex-wrap gap-2">
                    <Tag to={`/arcs/${arc.arc_id}`} variant="arc">
                      {arc.title} Arc
                    </Tag>
                    {arc.saga && arc.saga_id && (
                      <Tag to={`/sagas/${arc.saga_id}`} variant="saga">
                        {arc.saga.title} Saga
                      </Tag>
                    )}
                  </div>
                )}
              </div>

              {chapter.num_page && (
                <div className="flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Pages</div>
                  </div>
                  <div className="text-4xl font-bold text-emerald-900">{chapter.num_page}</div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Chapter Information */}
        <Card className="mb-8 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <SectionTitle>Chapter Information</SectionTitle>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Chapter Number
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{chapter.number}</dd>
            </div>
            {chapter.title && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Title
                </dt>
                <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{chapter.title}</dd>
              </div>
            )}
            {chapter.volume && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Volume
                </dt>
                <dd className="text-sm text-right ml-4">
                  <Link to={`/volumes/${chapter.volume}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                    Volume {chapter.volume}
                  </Link>
                </dd>
              </div>
            )}
            {chapter.date && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Release Date
                </dt>
                <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{formatDate(chapter.date)}</dd>
              </div>
            )}
            {chapter.jump && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Jump Issue
                </dt>
                <dd className="text-sm font-semibold text-gray-900 text-right ml-4">{chapter.jump}</dd>
              </div>
            )}
            {arc && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Story Arc
                </dt>
                <dd className="text-sm text-right ml-4">
                  <Link to={`/arcs/${arc.arc_id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                    {arc.title}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Characters Appearing */}
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
                {characters.length > 0 && (
                  <span className="ml-2 text-base text-gray-500">({characters.length})</span>
                )}
              </SectionTitle>
            </div>
          </div>

          {charactersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : characters.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedCharacters.map((character) => {
                  const isDebut = character.chapter_list &&
                    character.chapter_list.length > 0 &&
                    Math.min(...character.chapter_list) === chapterNumber

                  return (
                    <Link
                      key={character.id}
                      to={`/characters/${character.id}`}
                      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${
                        isDebut
                          ? 'border-yellow-400 bg-yellow-50 hover:border-yellow-500'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1">
                            {character.name || 'Unknown'}
                          </h3>
                          {isDebut && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full whitespace-nowrap">
                              DEBUT
                            </span>
                          )}
                        </div>
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
                  )
                })}
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
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              <p>No character data available for this chapter.</p>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}

export default ChapterDetailPage
