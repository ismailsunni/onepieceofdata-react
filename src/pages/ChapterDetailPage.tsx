import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faLink, faCheck, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
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

    // Get characters whose chapter_list contains this chapter
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

function ChapterDetailPage() {
  const { number } = useParams<{ number: string }>()
  const navigate = useNavigate()
  const chapterNumber = number ? parseInt(number, 10) : null
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false)

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

  // Fetch all chapters for random navigation
  const { data: allChapters = [] } = useQuery({
    queryKey: ['chapters'],
    queryFn: fetchChapters,
  })

  // Handler for random chapter
  const handleRandomChapter = () => {
    if (allChapters.length > 0) {
      const randomChapter = allChapters[Math.floor(Math.random() * allChapters.length)]
      navigate(`/chapters/${randomChapter.number}`)
    }
  }

  if (chapterLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </main>
    )
  }

  if (!chapter) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Chapter Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The chapter you're looking for doesn't exist or couldn't be loaded.
          </p>
          <button
            onClick={() => navigate('/chapters')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Chapters
          </button>
        </div>
      </main>
    )
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

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
    const text = `Check out Chapter ${chapter.number}${chapter.title ? `: ${chapter.title}` : ''} from One Piece!`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const wikiUrl = `https://onepiece.fandom.com/wiki/Chapter_${chapter.number}`

  return (
    <main className="container mx-auto px-4 py-4 md:py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 md:mb-6 text-xs md:text-sm text-gray-600">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <span className="mx-1 md:mx-2">/</span>
        <Link to="/chapters" className="hover:text-blue-600 transition-colors">
          Chapters
        </Link>
        <span className="mx-1 md:mx-2">/</span>
        <span className="text-gray-800 font-medium">Chapter {chapter.number}</span>
      </nav>

      {/* Header with Navigation */}
      <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 gap-2">
        <button
          onClick={() => navigate('/chapters')}
          className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors cursor-pointer"
          title="Back to Chapters"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/chapters/${chapter.number - 1}`)}
            disabled={chapter.number <= 1}
            className="flex items-center gap-1 px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 cursor-pointer"
            title="Previous Chapter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden md:inline font-medium">Prev</span>
          </button>

          <button
            onClick={handleRandomChapter}
            className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all cursor-pointer"
            title="Random Chapter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden md:inline font-medium">Random</span>
          </button>

          <button
            onClick={() => navigate(`/chapters/${chapter.number + 1}`)}
            className="flex items-center gap-1 px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
            title="Next Chapter"
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
            className="flex items-center justify-center w-10 h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            title={copyLinkFeedback ? 'Copied!' : 'Copy link to clipboard'}
          >
            <FontAwesomeIcon icon={copyLinkFeedback ? faCheck : faLink} className="text-lg" />
          </button>
          <button
            onClick={handleShareToTwitter}
            className="flex items-center justify-center w-10 h-10 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
            title="Share on Twitter"
          >
            <FontAwesomeIcon icon={faXTwitter} className="text-lg" />
          </button>
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            title="View on Wiki"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-lg" />
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-linear-to-r from-green-600 to-green-800 text-white p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">
                Chapter {chapter.number}
              </h1>
              {chapter.title && (
                <p className="text-lg md:text-xl opacity-90">{chapter.title}</p>
              )}
              {arc && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/arcs/${arc.arc_id}`}
                    className="inline-block px-3 py-1 bg-white rounded-full text-sm font-medium text-green-800 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {arc.title} Arc
                  </Link>
                  {arc.saga && arc.saga_id && (
                    <Link
                      to={`/sagas/${arc.saga_id}`}
                      className="inline-block px-3 py-1 bg-white rounded-full text-sm font-medium text-green-800 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      {arc.saga.title} Saga
                    </Link>
                  )}
                </div>
              )}
            </div>
            {chapter.num_page && (
              <div className="text-left sm:text-right">
                <div className="text-xs md:text-sm opacity-90">Pages</div>
                <div className="text-2xl md:text-3xl font-bold">{chapter.num_page}</div>
              </div>
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="p-4 md:p-8">
          {/* Chapter Information */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
              Chapter Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <DetailRow label="Chapter Number" value={chapter.number.toString()} />
              <DetailRow label="Title" value={chapter.title} />
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Volume:</span>
                {chapter.volume ? (
                  <Link
                    to={`/volumes/${chapter.volume}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {chapter.volume}
                  </Link>
                ) : (
                  <span className="text-gray-800">N/A</span>
                )}
              </div>
              <DetailRow label="Release Date" value={formatDate(chapter.date)} />
              <DetailRow label="Number of Pages" value={chapter.num_page?.toString()} />
              <DetailRow label="Jump Issue" value={chapter.jump} />
              {arc && <DetailRow label="Story Arc" value={arc.title} />}
              <DetailRow label="Characters Appearing" value={characters.length.toString()} />
            </div>
          </div>

          {/* Characters Appearing */}
          <div className="border-t pt-6 md:pt-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">
              Characters Appearing in This Chapter
              {characters.length > 0 && (
                <span className="ml-2 text-base md:text-lg text-gray-500">
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
                {characters.map((character) => {
                  // Check if this is the character's debut chapter
                  const isDebut = character.chapter_list &&
                    character.chapter_list.length > 0 &&
                    Math.min(...character.chapter_list) === chapterNumber

                  return (
                    <Link
                      key={character.id}
                      to={`/characters/${character.id}`}
                      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
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
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <p>No character data available for this chapter.</p>
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
          <span>Share this chapter</span>
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

export default ChapterDetailPage
