import { useMemo, useState } from 'react'
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
import { Volume } from '../types/volume'
import { Chapter } from '../types/chapter'
import { Character } from '../types/character'
import { Arc, Saga } from '../types/arc'
import { fetchVolumes } from '../services/volumeService'
import { fetchArcs } from '../services/arcService'
import { fetchSagas } from '../services/sagaService'
import SortableTable, { Column } from '../components/common/SortableTable'

// Service functions
async function fetchVolumeByNumber(
  volumeNumber: number
): Promise<Volume | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('volume')
      .select('*')
      .eq('number', volumeNumber)
      .single()

    if (error) {
      logger.error('Error fetching volume:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchVolumeByNumber:', error)
    return null
  }
}

async function fetchChaptersByVolume(volumeNumber: number): Promise<Chapter[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('chapter')
      .select('*')
      .eq('volume', volumeNumber)
      .order('number', { ascending: true })

    if (error) {
      logger.error('Error fetching chapters by volume:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchChaptersByVolume:', error)
    return []
  }
}

async function fetchCharactersByVolume(
  volumeNumber: number
): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('volume_list', [volumeNumber])
      .order('first_appearance', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by volume:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersByVolume:', error)
    return []
  }
}

async function fetchCharactersByCoverVolume(
  volumeNumber: number
): Promise<Character[]> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return []
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .contains('cover_volume_list', [volumeNumber])
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching characters by cover volume:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error in fetchCharactersByCoverVolume:', error)
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

function VolumeDetailPage() {
  const { number } = useParams<{ number: string }>()
  const navigate = useNavigate()
  const volumeNumber = number ? parseInt(number, 10) : null
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false)
  const [hideStrawHats, setHideStrawHats] = useState(false)

  const { data: volume, isLoading: volumeLoading } = useQuery({
    queryKey: ['volume', volumeNumber],
    queryFn: () => fetchVolumeByNumber(volumeNumber!),
    enabled: !!volumeNumber,
  })

  const { data: chapters = [] } = useQuery({
    queryKey: ['volume-chapters', volumeNumber],
    queryFn: () => fetchChaptersByVolume(volumeNumber!),
    enabled: !!volumeNumber,
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['volume-characters', volumeNumber],
    queryFn: () => fetchCharactersByVolume(volumeNumber!),
    enabled: !!volumeNumber,
  })

  const { data: coverCharacters = [] } = useQuery({
    queryKey: ['volume-cover-characters', volumeNumber],
    queryFn: () => fetchCharactersByCoverVolume(volumeNumber!),
    enabled: !!volumeNumber,
  })

  const { data: allVolumes = [] } = useQuery({
    queryKey: ['volumes'],
    queryFn: fetchVolumes,
  })

  const { data: allArcs = [] } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  const { data: allSagas = [] } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
  })

  // Arcs and sagas this volume covers — overlap on chapter ranges.
  const { volumeArcs, volumeSagas, volumeStartChapter, volumeEndChapter } =
    useMemo(() => {
      if (chapters.length === 0) {
        return {
          volumeArcs: [] as Arc[],
          volumeSagas: [] as Saga[],
          volumeStartChapter: null as number | null,
          volumeEndChapter: null as number | null,
        }
      }
      const start = chapters[0].number
      const end = chapters[chapters.length - 1].number
      const overlap = (s: number, e: number) => s <= end && e >= start
      return {
        volumeArcs: allArcs
          .filter((a) => overlap(a.start_chapter, a.end_chapter))
          .sort((a, b) => a.start_chapter - b.start_chapter),
        volumeSagas: allSagas
          .filter((s) => overlap(s.start_chapter, s.end_chapter))
          .sort((a, b) => a.start_chapter - b.start_chapter),
        volumeStartChapter: start,
        volumeEndChapter: end,
      }
    }, [chapters, allArcs, allSagas])

  const handleRandomVolume = () => {
    if (allVolumes.length > 0) {
      const randomVolume =
        allVolumes[Math.floor(Math.random() * allVolumes.length)]
      navigate(`/volumes/${randomVolume.number}`)
    }
  }

  if (volumeLoading) {
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

  if (!volume) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Volume Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The volume you're looking for doesn't exist or couldn't be loaded.
            </p>
            <button
              onClick={() => navigate('/volumes')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Volumes
            </button>
          </Card>
        </div>
      </main>
    )
  }

  const totalPages = chapters.reduce(
    (sum, chapter) => sum + (chapter.num_page || 0),
    0
  )
  const chapterRange =
    chapters.length > 0
      ? `${chapters[0].number}-${chapters[chapters.length - 1].number}`
      : 'N/A'

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopyLinkFeedback(true)
      setTimeout(() => setCopyLinkFeedback(false), 2000)
    })
  }

  const handleShareToTwitter = () => {
    const text = `Check out Volume ${volume.number}${volume.title ? `: ${volume.title}` : ''} from One Piece!`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const wikiUrl = `https://onepiece.fandom.com/wiki/Volume_${volume.number}`

  const filteredCharacters = hideStrawHats
    ? characters.filter((c) => !STRAW_HAT_IDS.has(c.id))
    : characters

  const volStart = volumeStartChapter ?? 0
  const volEnd = volumeEndChapter ?? 9999

  const countAppearancesInVolume = (chapterList: number[] | null) => {
    if (!chapterList) return 0
    return chapterList.filter((ch) => ch >= volStart && ch <= volEnd).length
  }

  const chapterColumns: Column<Chapter>[] = [
    {
      key: 'number',
      label: '#',
      sortValue: (row) => row.number,
      render: (row) => (
        <Link
          to={`/chapters/${row.number}`}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {row.number}
        </Link>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortValue: (row) => row.title ?? '',
      render: (row) => row.title || '-',
    },
    {
      key: 'num_page',
      label: 'Pages',
      sortValue: (row) => row.num_page ?? 0,
      render: (row) => row.num_page ?? '-',
    },
    {
      key: 'date',
      label: 'Date',
      sortValue: (row) => row.date ?? '',
      render: (row) =>
        row.date
          ? new Date(row.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '-',
    },
  ]

  const characterColumns: Column<Character>[] = [
    {
      key: 'name',
      label: 'Name',
      sortValue: (row) => row.name ?? '',
      render: (row) => {
        const isDebut =
          row.volume_list &&
          row.volume_list.length > 0 &&
          Math.min(...row.volume_list) === volumeNumber
        return (
          <span className="inline-flex items-center gap-2">
            <Link
              to={`/characters/${row.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              {row.name || 'Unknown'}
            </Link>
            {isDebut && (
              <span className="px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded">
                DEBUT
              </span>
            )}
          </span>
        )
      },
    },
    {
      key: 'volume_appearances',
      label: 'App. in Volume',
      sortValue: (row) => countAppearancesInVolume(row.chapter_list),
      render: (row) => countAppearancesInVolume(row.chapter_list) || '-',
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

  const coverCharacterColumns: Column<Character>[] = [
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
      key: 'cover_appearance_count',
      label: 'Total Cover Appearances',
      sortValue: (row) => row.cover_appearance_count ?? 0,
      render: (row) => row.cover_appearance_count ?? '-',
    },
  ]

  const arcColumns: Column<Arc>[] = [
    {
      key: 'title',
      label: 'Arc',
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
      key: 'chapter_range',
      label: 'Chapters',
      sortValue: (row) => row.start_chapter,
      render: (row) =>
        row.start_chapter === row.end_chapter
          ? `Ch. ${row.start_chapter}`
          : `Ch. ${row.start_chapter}–${row.end_chapter}`,
    },
    {
      key: 'total_chapters',
      label: 'Total Chapters',
      sortValue: (row) => row.end_chapter - row.start_chapter + 1,
      render: (row) => row.end_chapter - row.start_chapter + 1,
    },
  ]

  const sagaColumns: Column<Saga>[] = [
    {
      key: 'title',
      label: 'Saga',
      sortValue: (row) => row.title,
      render: (row) => (
        <Link
          to={`/sagas/${row.saga_id}`}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'chapter_range',
      label: 'Chapters',
      sortValue: (row) => row.start_chapter,
      render: (row) =>
        row.start_chapter === row.end_chapter
          ? `Ch. ${row.start_chapter}`
          : `Ch. ${row.start_chapter}–${row.end_chapter}`,
    },
    {
      key: 'total_chapters',
      label: 'Total Chapters',
      sortValue: (row) => row.end_chapter - row.start_chapter + 1,
      render: (row) => row.end_chapter - row.start_chapter + 1,
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
          <Link to="/volumes" className="hover:text-gray-900 transition-colors">
            Volumes
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
          <span className="text-gray-900 font-medium">
            Volume {volume.number}
          </span>
        </nav>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/volumes')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
            title="Back to Volumes"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/volumes/${volume.number - 1}`)}
              disabled={volume.number <= 1}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              title="Previous Volume"
            >
              <span className="hidden md:inline text-sm font-medium">Prev</span>
              <span className="md:hidden text-sm font-medium">‹</span>
            </button>

            <button
              onClick={handleRandomVolume}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm"
              title="Random Volume"
            >
              <span className="text-sm font-medium">Random</span>
            </button>

            <button
              onClick={() => navigate(`/volumes/${volume.number + 1}`)}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all shadow-sm"
              title="Next Volume"
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
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 opacity-60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>

          <Card className="relative border-2 border-amber-100">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-block mb-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-2">
                    Volume {volume.number}
                  </h1>
                  <div className="h-1 w-32 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full"></div>
                </div>
                {volume.title && (
                  <p className="text-xl text-gray-700 font-medium">
                    {volume.title}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-amber-600"
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
                  <div className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                    Chapters
                  </div>
                </div>
                <div className="text-4xl font-bold text-amber-900">
                  {chapters.length}
                </div>
                {chapters.length > 0 && (
                  <div className="text-xs text-amber-700 mt-1">
                    {chapterRange}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Volume Information */}
        <Card className="mb-8 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-amber-100 rounded-lg">
              <svg
                className="w-5 h-5 text-amber-600"
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
            <SectionTitle>Volume Information</SectionTitle>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">
                Volume Number
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {volume.number}
              </dd>
            </div>
            {volume.title && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Title</dt>
                <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                  {volume.title}
                </dd>
              </div>
            )}
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Chapters</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {chapters.length}
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
            {totalPages > 0 && (
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-500">
                  Total Pages
                </dt>
                <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                  {totalPages}
                </dd>
              </div>
            )}
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Characters</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {characters.length}
              </dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">
                Arcs Covered
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {volumeArcs.length}
              </dd>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">
                Sagas Covered
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                {volumeSagas.length}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Sagas in This Volume */}
        {volumeSagas.length > 0 && (
          <Card className="mb-8 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z"
                  />
                </svg>
              </div>
              <SectionTitle>
                Sagas in This Volume
                <span className="ml-2 text-base text-gray-500">
                  ({volumeSagas.length})
                </span>
              </SectionTitle>
            </div>
            <SortableTable<Saga>
              columns={sagaColumns}
              data={volumeSagas}
              defaultSortField="chapter_range"
              defaultSortDirection="asc"
              rowKey={(row) => row.saga_id}
            />
          </Card>
        )}

        {/* Arcs in This Volume */}
        {volumeArcs.length > 0 && (
          <Card className="mb-8 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-pink-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <SectionTitle>
                Story Arcs in This Volume
                <span className="ml-2 text-base text-gray-500">
                  ({volumeArcs.length})
                </span>
              </SectionTitle>
            </div>
            <SortableTable<Arc>
              columns={arcColumns}
              data={volumeArcs}
              defaultSortField="chapter_range"
              defaultSortDirection="asc"
              rowKey={(row) => row.arc_id}
            />
          </Card>
        )}

        {/* Chapters */}
        {chapters.length > 0 && (
          <Card className="mb-8 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-600"
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
                </div>
                <SectionTitle>
                  Chapters
                  <span className="ml-2 text-base text-gray-500">
                    ({chapters.length})
                  </span>
                </SectionTitle>
              </div>
            </div>

            <SortableTable<Chapter>
              columns={chapterColumns}
              data={chapters}
              defaultSortField="number"
              defaultSortDirection="asc"
              rowKey={(row) => row.number}
            />
          </Card>
        )}

        {/* Characters on Cover */}
        {coverCharacters.length > 0 && (
          <Card className="mb-8 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <SectionTitle>
                  Characters on Cover
                  <span className="ml-2 text-base text-gray-500">
                    ({coverCharacters.length})
                  </span>
                </SectionTitle>
              </div>
            </div>

            <SortableTable<Character>
              columns={coverCharacterColumns}
              data={coverCharacters}
              defaultSortField="name"
              defaultSortDirection="asc"
              rowKey={(row) => row.id}
            />
          </Card>
        )}

        {/* Characters */}
        {characters.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
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
                    ({characters.length})
                  </span>
                </SectionTitle>
              </div>
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
            <SortableTable<Character>
              columns={characterColumns}
              data={filteredCharacters}
              defaultSortField="volume_appearances"
              defaultSortDirection="desc"
              rowKey={(row) => row.id}
            />
          </Card>
        )}
      </div>
    </main>
  )
}

export default VolumeDetailPage
