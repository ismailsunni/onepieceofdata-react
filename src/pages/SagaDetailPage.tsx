import { useState } from 'react'
import { STRAW_HAT_IDS } from '../constants/characters'
import { logger } from '../utils/logger'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faLink,
  faCheck,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons'
import { faXTwitter } from '@fortawesome/free-brands-svg-icons'
import { supabase } from '../services/supabase'
import { Saga, Arc } from '../types/arc'
import { Character } from '../types/character'
import SortableTable, { Column } from '../components/common/SortableTable'

// Service functions
async function fetchSagaById(id: string): Promise<Saga | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('saga')
      .select('*')
      .eq('saga_id', id)
      .single()

    if (error) {
      logger.error('Error fetching saga:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchSagaById:', error)
    return null
  }
}

async function fetchArcsBySaga(sagaId: string): Promise<Arc[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('arc')
      .select('*')
      .eq('saga_id', sagaId)
      .order('start_chapter', { ascending: true })

    if (error) {
      logger.error('Error fetching arcs by saga:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchArcsBySaga:', error)
    return []
  }
}

async function fetchCharactersBySaga(sagaId: string): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('saga_list', [sagaId])
      .order('first_appearance', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by saga:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersBySaga:', error)
    return []
  }
}

async function fetchVolumeRange(
  startChapter: number,
  endChapter: number
): Promise<{ startVol: number | null; endVol: number | null }> {
  if (!supabase) return { startVol: null, endVol: null }
  const { data } = await supabase
    .from('chapter')
    .select('volume')
    .gte('number', startChapter)
    .lte('number', endChapter)
    .not('volume', 'is', null)
    .order('volume', { ascending: true })
  if (!data || data.length === 0) return { startVol: null, endVol: null }
  const volumes = data.map((d) => d.volume).filter(Boolean) as number[]
  return { startVol: Math.min(...volumes), endVol: Math.max(...volumes) }
}

async function fetchSagas(): Promise<Saga[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('saga')
      .select('*')
      .order('start_chapter', { ascending: true })

    if (error) {
      logger.error('Error fetching sagas:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchSagas:', error)
    return []
  }
}

// ===== REUSABLE COMPONENTS =====

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-gray-900 mb-4">{children}</h2>
  )
}

function SagaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false)
  const [hideStrawHats, setHideStrawHats] = useState(false)

  const { data: saga, isLoading: sagaLoading } = useQuery({
    queryKey: ['saga', id],
    queryFn: () => fetchSagaById(id!),
    enabled: !!id,
  })

  const { data: arcs = [] } = useQuery({
    queryKey: ['saga-arcs', saga?.saga_id],
    queryFn: () => fetchArcsBySaga(saga!.saga_id),
    enabled: !!saga,
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['saga-characters', saga?.saga_id],
    queryFn: () => fetchCharactersBySaga(saga!.saga_id),
    enabled: !!saga,
  })

  const { data: volumeRange } = useQuery({
    queryKey: ['saga-volumes', saga?.start_chapter, saga?.end_chapter],
    queryFn: () => fetchVolumeRange(saga!.start_chapter, saga!.end_chapter),
    enabled: !!saga,
  })

  const { data: allSagas = [] } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
  })

  const sortedSagas = [...allSagas].sort(
    (a, b) => a.start_chapter - b.start_chapter
  )
  const currentIndex = sortedSagas.findIndex((s) => s.saga_id === saga?.saga_id)
  const previousSaga = currentIndex > 0 ? sortedSagas[currentIndex - 1] : null
  const nextSaga =
    currentIndex < sortedSagas.length - 1 ? sortedSagas[currentIndex + 1] : null

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

  const arcColumns: Column<Arc>[] = [
    {
      key: 'title',
      label: 'Title',
      sortValue: (row) => row.title,
      render: (row) => (
        <Link
          to={`/arcs/${row.arc_id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'start_chapter',
      label: 'Start Chapter',
      sortValue: (row) => row.start_chapter,
      render: (row) => row.start_chapter,
    },
    {
      key: 'end_chapter',
      label: 'End Chapter',
      sortValue: (row) => row.end_chapter,
      render: (row) => row.end_chapter,
    },
    {
      key: 'total_chapters',
      label: 'Total Chapters',
      sortValue: (row) => row.end_chapter - row.start_chapter + 1,
      render: (row) => row.end_chapter - row.start_chapter + 1,
    },
  ]

  const filteredCharacters = hideStrawHats
    ? characters.filter((c) => !STRAW_HAT_IDS.has(c.id))
    : characters

  const sagaStart = saga?.start_chapter ?? 0
  const sagaEnd = saga?.end_chapter ?? 9999

  const countAppearancesInRange = (chapters: number[] | null) => {
    if (!chapters) return 0
    return chapters.filter((ch) => ch >= sagaStart && ch <= sagaEnd).length
  }

  const characterColumns: Column<Character>[] = [
    {
      key: 'name',
      label: 'Name',
      sortValue: (row) => row.name ?? '',
      render: (row) => (
        <Link
          to={`/characters/${row.id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {row.name || 'Unknown'}
        </Link>
      ),
    },
    {
      key: 'saga_appearances',
      label: 'App. in Saga',
      sortValue: (row) => countAppearancesInRange(row.chapter_list),
      render: (row) => countAppearancesInRange(row.chapter_list) || '-',
    },
    {
      key: 'status',
      label: 'Status',
      sortValue: (row) => row.status ?? '',
      render: (row) => row.status || '-',
    },
    {
      key: 'bounty',
      label: 'Bounty',
      sortValue: (row) => row.bounty ?? -1,
      render: (row) =>
        row.bounty != null && row.bounty > 0
          ? `₿${row.bounty.toLocaleString()}`
          : '-',
    },
    {
      key: 'first_appearance',
      label: 'First Appearance',
      sortValue: (row) => row.first_appearance ?? 0,
      render: (row) =>
        row.first_appearance ? `Ch. ${row.first_appearance}` : '-',
    },
    {
      key: 'appearance_count',
      label: 'Total Appearances',
      sortValue: (row) => row.appearance_count ?? 0,
      render: (row) => row.appearance_count ?? '-',
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <Link to="/sagas" className="hover:text-gray-900 transition-colors">
            Sagas
          </Link>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
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
              onClick={() =>
                previousSaga && navigate(`/sagas/${previousSaga.saga_id}`)
              }
              disabled={!previousSaga}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title={
                previousSaga
                  ? `Previous: ${previousSaga.title}`
                  : 'No previous saga'
              }
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
              <FontAwesomeIcon
                icon={copyLinkFeedback ? faCheck : faLink}
                className="w-4 h-4 text-gray-700"
              />
            </button>
            <button
              onClick={handleShareToTwitter}
              className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg transition-colors shadow-sm"
              title="Share on Twitter"
            >
              <FontAwesomeIcon
                icon={faXTwitter}
                className="w-4 h-4 text-gray-700"
              />
            </button>
            <a
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg transition-colors shadow-sm"
              title="View on Wiki"
            >
              <FontAwesomeIcon
                icon={faExternalLinkAlt}
                className="w-4 h-4 text-gray-700"
              />
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
                  <p className="text-lg text-gray-600 mb-1">
                    {saga.japanese_title}
                  </p>
                )}
                {saga.romanized_title && (
                  <p className="text-base text-gray-500">
                    {saga.romanized_title}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div className="text-sm font-semibold text-purple-800 uppercase tracking-wide">
                    Chapters
                  </div>
                </div>
                <div className="text-4xl font-bold text-purple-900">
                  {chapterCount}
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  {chapterRange}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Saga Information */}
        <Card className="mb-8 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <SectionTitle>Saga Information</SectionTitle>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Saga ID</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {saga.saga_id}
              </dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">
                Start Chapter
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {saga.start_chapter}
              </dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">End Chapter</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {saga.end_chapter}
              </dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">
                Total Chapters
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {chapterCount}
              </dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">
                Chapter Range
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {chapterRange}
              </dd>
            </div>
            {volumeRange?.startVol && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Volumes</dt>
                <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                  Vol. {volumeRange.startVol}
                  {volumeRange.endVol !== volumeRange.startVol
                    ? ` – ${volumeRange.endVol}`
                    : ''}
                </dd>
              </div>
            )}
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">
                Number of Arcs
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {arcs.length}
              </dd>
            </div>
          </dl>

          {saga.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Description
              </h3>
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
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <SectionTitle>
                Story Arcs in This Saga
                <span className="ml-2 text-base text-gray-500">
                  ({arcs.length})
                </span>
              </SectionTitle>
            </div>

            <SortableTable
              columns={arcColumns}
              data={arcs}
              defaultSortField="start_chapter"
              defaultSortDirection="asc"
              rowKey={(row) => row.arc_id}
              maxHeight="600px"
            />
          </Card>
        )}

        {/* Characters */}
        {characters.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <SectionTitle>
                Characters Appearing
                <span className="ml-2 text-base text-gray-500">
                  ({filteredCharacters.length})
                </span>
              </SectionTitle>
            </div>
            <div className="mb-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideStrawHats}
                  onChange={(e) => setHideStrawHats(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Hide Straw Hat Pirates
              </label>
            </div>

            <SortableTable
              columns={characterColumns}
              data={filteredCharacters}
              defaultSortField="saga_appearances"
              defaultSortDirection="desc"
              rowKey={(row) => row.id}
              maxHeight="600px"
            />
          </Card>
        )}

        {/* Analytics Cross-links */}
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-indigo-700">
            Explore in Analytics:
          </span>
          <Link
            to="/analytics/appearances"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Saga Appearance Matrix
          </Link>
          <Link
            to="/analytics/story"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Story & Arc Analytics
          </Link>
        </div>
      </div>
    </main>
  )
}

export default SagaDetailPage
