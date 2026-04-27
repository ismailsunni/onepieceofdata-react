import { useParams, useNavigate, Link } from 'react-router-dom'
import { logger } from '../utils/logger'
import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faLink,
  faCheck,
  faExternalLinkAlt,
  faChevronDown,
  faChevronUp,
  faShuffle,
} from '@fortawesome/free-solid-svg-icons'
import { faXTwitter } from '@fortawesome/free-brands-svg-icons'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '../services/supabase'
import { Character } from '../types/character'
import { fetchArcs } from '../services/arcService'
import { Arc, Saga } from '../types/arc'
import { fetchAffiliationsByCharacter } from '../services/affiliationService'
import { CharacterAffiliation } from '../types/affiliation'
import { fetchOccupationsByCharacter } from '../services/occupationService'
import { CharacterOccupation } from '../types/occupation'
import { fetchDevilFruitsByCharacter } from '../services/devilFruitService'
import { CharacterDevilFruit } from '../types/devilFruit'

// Service function to fetch a single character by ID
async function fetchCharacterById(id: string): Promise<Character | null> {
  try {
    if (!supabase) {
      logger.error('Supabase client is not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('character')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching character:', error)
      return null
    }

    return data
  } catch (error) {
    logger.error('Error in fetchCharacterById:', error)
    return null
  }
}

// Service function to fetch all sagas
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

// InfoRow component for label-value pairs (kept for future use)
// function InfoRow({ label, value }: { label: string; value: string | null | undefined | React.ReactNode }) {
//   return (
//     <div className="flex justify-between items-start py-2">
//       <dt className="text-sm text-gray-500 flex-shrink-0">{label}</dt>
//       <dd className="text-sm font-medium text-gray-900 text-right ml-4">{value || 'N/A'}</dd>
//     </div>
//   )
// }

// Tag component for appearance tags
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightName(text: string, name: string | null): React.ReactNode[] {
  if (!name || !text) return [text]
  const terms = new Set<string>()
  terms.add(name.trim())
  for (const part of name.split(/\s+/)) {
    const cleaned = part.replace(/[.,;:]$/, '')
    if (cleaned.length >= 3) terms.add(cleaned)
  }
  const pattern = [...terms]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|')
  if (!pattern) return [text]
  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-gray-900">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function Tag({
  children,
  to,
  variant = 'default',
}: {
  children: React.ReactNode
  to?: string
  variant?:
    | 'saga'
    | 'arc'
    | 'chapter'
    | 'volume'
    | 'affiliation'
    | 'occupation'
    | 'default'
}) {
  const variantStyles = {
    saga: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    arc: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    chapter: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    volume: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    affiliation: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
    occupation: 'bg-teal-50 text-teal-700 hover:bg-teal-100',
    default: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
  }

  const className = `inline-block px-3 py-1 rounded-full text-xs font-medium transition-colors ${variantStyles[variant]}`

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  }

  return <span className={className}>{children}</span>
}

// Card component wrapper
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

// SectionTitle component
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-gray-900 mb-4">{children}</h2>
  )
}

function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showBountyChart, setShowBountyChart] = useState(false)
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false)
  const [showAllChapters, setShowAllChapters] = useState(false)

  const {
    data: character,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['character', id],
    queryFn: () => fetchCharacterById(id!),
    enabled: !!id,
  })

  // Fetch arcs and sagas for name mapping
  const { data: arcs = [] } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
  })

  const { data: sagas = [] } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
  })

  const { data: occupations = [] } = useQuery({
    queryKey: ['character-occupations', id],
    queryFn: () => fetchOccupationsByCharacter(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })

  const { data: affiliations = [] } = useQuery({
    queryKey: ['character-affiliations', id],
    queryFn: () => fetchAffiliationsByCharacter(id!),
    enabled: !!id,
  })

  const { data: devilFruits = [] } = useQuery<CharacterDevilFruit[]>({
    queryKey: ['character-devil-fruits', id],
    queryFn: () => fetchDevilFruitsByCharacter(id!),
    enabled: !!id,
  })

  // Character portrait state — must be declared before any early returns so
  // hook order is stable across renders.
  const [imgError, setImgError] = useState(false)
  const handleImgError = useCallback(() => setImgError(true), [])

  // Lightweight ID-only list for the "random character" button.
  const { data: characterIds = [] } = useQuery({
    queryKey: ['character-ids'],
    queryFn: async () => {
      if (!supabase) return []
      const { data } = await supabase.from('character').select('id')
      return (data ?? []).map((r) => r.id as string)
    },
    staleTime: 30 * 60 * 1000,
  })

  const handleRandomCharacter = useCallback(() => {
    const others = characterIds.filter((cid) => cid !== id)
    if (others.length === 0) return
    const randomId = others[Math.floor(Math.random() * others.length)]
    navigate(`/characters/${randomId}`)
  }, [characterIds, id, navigate])

  // Create lookup maps
  const arcMap = new Map<string, Arc>()
  arcs.forEach((arc) => arcMap.set(arc.arc_id, arc))

  const sagaMap = new Map<string, Saga>()
  sagas.forEach((saga) => sagaMap.set(saga.saga_id, saga))

  if (isLoading) {
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

  if (error || !character) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Character Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The character you're looking for doesn't exist or couldn't be
              loaded.
            </p>
            <button
              onClick={() => navigate('/characters')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Characters
            </button>
          </Card>
        </div>
      </main>
    )
  }

  // Convert character ID to wiki URL format
  const wikiName = character.id
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('_')
  const wikiUrl = `https://onepiece.fandom.com/wiki/${wikiName}`

  // Character portrait from Supabase storage bucket.
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const characterImageUrl = `${supabaseUrl}/storage/v1/object/public/character-images/${encodeURIComponent(character.id)}.png`

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
    const text = `Check out ${character.name || 'this character'} from One Piece!`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  // Format bounty
  const formatBounty = (bounty: number | null) => {
    if (!bounty) return 'Unknown'
    if (bounty === 0) return 'None'
    return `₿${bounty.toLocaleString()}`
  }

  // Format bounty history
  const formatBountyHistory = (bountiesStr: string | null) => {
    if (!bountiesStr) return null

    const bountyNumbers = bountiesStr
      .replace(/[₿Ƀ฿]/g, '')
      .split(/[;>]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        const num = parseInt(s.replace(/[^0-9]/g, ''), 10)
        return isNaN(num) || num === 0 ? null : num
      })
      .filter((n) => n !== null) as number[]

    if (bountyNumbers.length === 0) {
      return bountiesStr
    }

    bountyNumbers.sort((a, b) => a - b)

    return bountyNumbers.map((b) => {
      if (b >= 1000000000) {
        return `₿${(b / 1000000000).toFixed(2)}B`
      } else if (b >= 1000000) {
        return `₿${(b / 1000000).toFixed(0)}M`
      } else if (b >= 1000) {
        return `₿${(b / 1000).toFixed(0)}K`
      } else {
        return `₿${b.toLocaleString()}`
      }
    })
  }

  // Format bounty value for chart display
  const formatBountyValue = (bounty: number) => {
    if (bounty >= 1000000000) {
      return `₿${(bounty / 1000000000).toFixed(2)}B`
    } else if (bounty >= 1000000) {
      return `₿${(bounty / 1000000).toFixed(0)}M`
    } else if (bounty >= 1000) {
      return `₿${(bounty / 1000).toFixed(0)}K`
    } else {
      return `₿${bounty.toLocaleString()}`
    }
  }

  // Status badge color
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'alive':
        return 'bg-green-100 text-green-700'
      case 'deceased':
        return 'bg-red-100 text-red-700'
      case 'unknown':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Format birth date to human-readable format
  const formatBirthDate = (birthDate: string | null) => {
    if (!birthDate) return null

    const dateMatch = birthDate.match(/(\d{1,2})[-/](\d{1,2})/)
    if (dateMatch) {
      const [, month, day] = dateMatch
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]

      const monthNum = parseInt(month, 10)
      const dayNum = parseInt(day, 10)

      if (monthNum >= 1 && monthNum <= 12) {
        return `${dayNum} ${monthNames[monthNum - 1]}`
      }
    }

    return birthDate
  }

  // Handle chapters display
  const displayedChapters = showAllChapters
    ? character.chapter_list
    : character.chapter_list?.slice(0, 30)

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
          <Link
            to="/characters"
            className="hover:text-gray-900 transition-colors"
          >
            Characters
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
            {character.name || 'Unknown'}
          </span>
        </nav>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/characters')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
              title="Back to Characters"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <button
              onClick={handleRandomCharacter}
              disabled={characterIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go to a random character"
            >
              <FontAwesomeIcon icon={faShuffle} className="w-4 h-4" />
              <span className="text-sm font-medium">Random</span>
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
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>

          <Card className="relative border-2 border-blue-100">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
              {/* Portrait */}
              <div className="flex-shrink-0 self-center lg:self-start">
                {imgError ? (
                  <div className="w-32 h-40 lg:w-40 lg:h-48 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={characterImageUrl}
                    alt={character.name || 'Character portrait'}
                    className="w-32 lg:w-40 max-h-48 lg:max-h-56 rounded-xl object-contain bg-gray-100 border-2 border-white shadow-md"
                    onError={handleImgError}
                  />
                )}
              </div>

              {/* Character Name & Status */}
              <div className="flex-1">
                <div className="inline-block mb-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                    {character.name || 'Unknown'}
                  </h1>
                  <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {character.name && (
                    <Link
                      to={`/analytics/story-graph?focus=${encodeURIComponent(character.name)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 hover:bg-fuchsia-100 transition-colors shadow-sm"
                      title="Open this character in the Story Graph"
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
                          d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.24 17 7c1 2-.5 4 .657 5.657z"
                        />
                      </svg>
                      View in Story Graph
                    </Link>
                  )}
                  {character.status && (
                    <span
                      className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(character.status)}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          character.status?.toLowerCase() === 'alive'
                            ? 'bg-green-500 animate-pulse'
                            : character.status?.toLowerCase() === 'deceased'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                        }`}
                      ></span>
                      {character.status}
                    </span>
                  )}
                  {character.origin && (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      <svg
                        className="w-3.5 h-3.5 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {character.origin}
                    </span>
                  )}
                </div>

                {character.bio && (
                  <p className="mt-4 text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                    {highlightName(character.bio, character.name)}
                  </p>
                )}
              </div>

              {/* Right: Bounty Display */}
              {character.bounty !== null && (
                <div className="flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-amber-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                      Current Bounty
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-amber-900">
                    {formatBounty(character.bounty)}
                  </div>
                  {character.bounties && (
                    <div className="mt-2 text-xs text-amber-700">
                      {(() => {
                        const bountyCount = character.bounties
                          .split(';')
                          .map((s) => parseInt(s.replace(/[^0-9]/g, ''), 10))
                          .filter((n) => !isNaN(n) && n > 0).length
                        return bountyCount > 1
                          ? `${bountyCount} bounty updates`
                          : 'Initial bounty'
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats Bar */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {character.appearance_count !== null &&
                  character.appearance_count !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {character.appearance_count}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Chapter Appearances
                      </div>
                    </div>
                  )}
                {character.volume_appearance_count !== null &&
                  character.volume_appearance_count !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {character.volume_appearance_count}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Volume Appearances
                      </div>
                    </div>
                  )}
                {character.first_appearance && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {character.first_appearance}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      First Chapter
                    </div>
                  </div>
                )}
                {character.arc_list && character.arc_list.length > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {character.arc_list.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Story Arcs</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Basic Information & Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Basic Information */}
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <SectionTitle>Basic Information</SectionTitle>
            </div>
            <dl className="space-y-4">
              {character.id && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    ID
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                    {character.id}
                  </dd>
                </div>
              )}
              {character.name && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Name
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                    {character.name}
                  </dd>
                </div>
              )}
              {character.origin && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    Origin
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                    {character.origin}
                  </dd>
                </div>
              )}
              {character.origin_region && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Region
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                    {character.origin_region}
                  </dd>
                </div>
              )}
              {character.age && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Age
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                    {character.age}
                  </dd>
                </div>
              )}
              {(character.birth_date || character.birth) && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"
                      />
                    </svg>
                    Birth Date
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                    {formatBirthDate(character.birth_date || character.birth)}
                  </dd>
                </div>
              )}
              {character.blood_type && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                    Blood Type
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 text-right ml-4">
                    {character.blood_type}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Statistics */}
          <Card className="hover:shadow-md transition-shadow">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <SectionTitle>Appearance History</SectionTitle>
            </div>
            <dl className="space-y-4">
              {character.first_appearance && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
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
                    First Appearance
                  </dt>
                  <dd className="text-sm text-right ml-4">
                    <span className="font-semibold text-gray-900">
                      Chapter {character.first_appearance}
                    </span>
                    {character.arc_list && character.arc_list.length > 0 && (
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {arcMap.get(character.arc_list[0])?.title ||
                          character.arc_list[0]}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {character.last_appearance && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
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
                    Last Appearance
                  </dt>
                  <dd className="text-sm text-right ml-4">
                    <span className="font-semibold text-gray-900">
                      Chapter {character.last_appearance}
                    </span>
                    {character.arc_list && character.arc_list.length > 0 && (
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {arcMap.get(
                          character.arc_list[character.arc_list.length - 1]
                        )?.title ||
                          character.arc_list[character.arc_list.length - 1]}
                      </span>
                    )}
                  </dd>
                </div>
              )}

              {/* Bounty History */}
              {character.bounties && (
                <div className="py-2 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Bounty History
                    </dt>
                  </div>
                  <dd className="text-right">
                    {(() => {
                      const formattedBounties = formatBountyHistory(
                        character.bounties
                      )
                      if (Array.isArray(formattedBounties)) {
                        const shouldTruncate = formattedBounties.length > 3
                        const displayBounties = shouldTruncate
                          ? [
                              formattedBounties[0],
                              '...',
                              ...formattedBounties.slice(-2),
                            ]
                          : formattedBounties

                        return (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              {displayBounties.map((bounty, index) => (
                                <span
                                  key={index}
                                  className="flex items-center gap-1"
                                >
                                  {bounty === '...' ? (
                                    <span className="px-2 py-0.5 text-gray-400 text-xs">
                                      ...
                                    </span>
                                  ) : (
                                    <Tag variant="volume">{bounty}</Tag>
                                  )}
                                  {index < displayBounties.length - 1 &&
                                    bounty !== '...' && (
                                      <span className="text-gray-400 text-xs">
                                        →
                                      </span>
                                    )}
                                </span>
                              ))}
                            </div>
                            {shouldTruncate && (
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setShowBountyChart(!showBountyChart)
                                  }
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
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
                                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                    />
                                  </svg>
                                  {showBountyChart
                                    ? 'Hide Chart'
                                    : 'View Chart'}
                                </button>
                                {showBountyChart && (
                                  <div className="absolute right-0 top-12 bg-white border-2 border-amber-200 rounded-xl shadow-2xl p-5 z-50 w-[500px]">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-sm font-semibold text-gray-900">
                                        Bounty Progression
                                      </h4>
                                      <button
                                        onClick={() =>
                                          setShowBountyChart(false)
                                        }
                                        className="text-gray-400 hover:text-gray-600"
                                      >
                                        <svg
                                          className="w-5 h-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="h-64">
                                      <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                      >
                                        <LineChart
                                          data={(() => {
                                            const bounties = character.bounties
                                              .split(';')
                                              .map((b) => b.trim())
                                            const parsed = bounties.map(
                                              (bountyStr) => {
                                                const numericBounty = parseInt(
                                                  bountyStr.replace(
                                                    /[^0-9]/g,
                                                    ''
                                                  )
                                                )
                                                return {
                                                  bounty: numericBounty,
                                                  str: bountyStr,
                                                }
                                              }
                                            )
                                            parsed.sort(
                                              (a, b) => a.bounty - b.bounty
                                            )

                                            return parsed.map(
                                              (item, index) => ({
                                                step: `#${index + 1}`,
                                                bounty: item.bounty,
                                                label: formatBountyValue(
                                                  item.bounty
                                                ),
                                              })
                                            )
                                          })()}
                                          margin={{
                                            top: 10,
                                            right: 30,
                                            left: 10,
                                            bottom: 20,
                                          }}
                                        >
                                          <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f3f4f6"
                                          />
                                          <XAxis
                                            dataKey="step"
                                            label={{
                                              value: 'Update',
                                              position: 'insideBottom',
                                              offset: -10,
                                            }}
                                            stroke="#6b7280"
                                          />
                                          <YAxis
                                            tickFormatter={(value) =>
                                              formatBountyValue(value)
                                            }
                                            stroke="#6b7280"
                                          />
                                          <Tooltip
                                            formatter={(value: number) => [
                                              `₿${value.toLocaleString()}`,
                                              'Bounty',
                                            ]}
                                            contentStyle={{
                                              backgroundColor: '#fff',
                                              border: '2px solid #fbbf24',
                                              borderRadius: '8px',
                                              boxShadow:
                                                '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                          />
                                          <Line
                                            type="monotone"
                                            dataKey="bounty"
                                            stroke="#f59e0b"
                                            strokeWidth={3}
                                            dot={{
                                              fill: '#f59e0b',
                                              r: 5,
                                              strokeWidth: 2,
                                              stroke: '#fff',
                                            }}
                                            activeDot={{ r: 7 }}
                                          />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      }
                      return formattedBounties || 'N/A'
                    })()}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        {/* Devil Fruits & Haki */}
        {(devilFruits.length > 0 ||
          character.haki_observation ||
          character.haki_armament ||
          character.haki_conqueror) && (
          <>
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-6 py-2 rounded-full border border-gray-300">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-500"
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
                    <h2 className="text-xl font-semibold text-gray-900">
                      Powers & Abilities
                    </h2>
                  </div>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Devil Fruits */}
              {devilFruits.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-violet-100 rounded-lg">
                        <svg
                          className="w-4 h-4 text-violet-600"
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        Devil Fruit{devilFruits.length > 1 ? 's' : ''}
                      </h3>
                    </div>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold">
                      {devilFruits.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {devilFruits.map((fruit) => (
                      <div
                        key={fruit.fruit_name}
                        className="border border-violet-100 rounded-lg p-4 bg-violet-50/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900">
                                {fruit.fruit_name}
                              </p>
                              {fruit.is_artificial && (
                                <span
                                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
                                  title="Artificial devil fruit"
                                >
                                  Artificial
                                </span>
                              )}
                            </div>
                            {fruit.fruit_model && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Model: {fruit.fruit_model}
                              </p>
                            )}
                            {fruit.english_name && (
                              <p className="text-sm text-gray-600">
                                {fruit.english_name}
                              </p>
                            )}
                            {fruit.meaning && (
                              <p className="text-xs text-gray-500 mt-1">
                                Meaning: {fruit.meaning}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {fruit.fruit_type && (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                  fruit.fruit_type === 'Logia'
                                    ? 'bg-sky-100 text-sky-700'
                                    : fruit.fruit_type === 'Zoan'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {fruit.fruit_type}
                              </span>
                            )}
                            {fruit.fruit_sub_type && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {fruit.fruit_sub_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Haki */}
              {(character.haki_observation ||
                character.haki_armament ||
                character.haki_conqueror) && (
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <svg
                        className="w-4 h-4 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Haki
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`text-center rounded-lg px-3 py-2 text-sm font-medium ${character.haki_observation ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400 line-through'}`}
                    >
                      Observation
                    </div>
                    <div
                      className={`text-center rounded-lg px-3 py-2 text-sm font-medium ${character.haki_armament ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400 line-through'}`}
                    >
                      Armament
                    </div>
                    <div
                      className={`text-center rounded-lg px-3 py-2 text-sm font-medium ${character.haki_conqueror ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400 line-through'}`}
                    >
                      Conqueror&apos;s
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Affiliations */}
        {affiliations.length > 0 && (
          <AffiliationsSection affiliations={affiliations} />
        )}

        {/* Occupations */}
        {occupations.length > 0 && (
          <OccupationsSection occupations={occupations} />
        )}

        {/* Appearance Details */}
        {(character.chapter_list ||
          character.volume_list ||
          character.arc_list ||
          character.saga_list) && (
          <>
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-6 py-2 rounded-full border border-gray-300">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Appearance Details
                    </h2>
                  </div>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sagas */}
              {character.saga_list && character.saga_list.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg
                          className="w-4 h-4 text-purple-600"
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        Sagas
                      </h3>
                    </div>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
                      {character.saga_list.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {character.saga_list.map((sagaId) => {
                      const saga = sagaMap.get(sagaId)
                      const sagaName = saga?.title || sagaId
                      return (
                        <Tag
                          key={sagaId}
                          to={`/sagas/${sagaId}`}
                          variant="saga"
                        >
                          {sagaName}
                        </Tag>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Arcs */}
              {character.arc_list && character.arc_list.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <svg
                          className="w-4 h-4 text-emerald-600"
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
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Arcs
                      </h3>
                    </div>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                      {character.arc_list.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {character.arc_list.map((arcId) => {
                      const arc = arcMap.get(arcId)
                      const arcName = arc?.title || arcId
                      return (
                        <Tag key={arcId} to={`/arcs/${arcId}`} variant="arc">
                          {arcName}
                        </Tag>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Chapters */}
              {character.chapter_list && character.chapter_list.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg
                          className="w-4 h-4 text-blue-600"
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        Chapters
                      </h3>
                    </div>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                      {character.chapter_list.length}
                    </span>
                  </div>
                  <div className="relative">
                    <div
                      className={`flex flex-wrap gap-1.5 ${!showAllChapters && character.chapter_list.length > 30 ? 'max-h-48 overflow-hidden' : 'max-h-96 overflow-y-auto'}`}
                    >
                      {displayedChapters?.map((chapter) => (
                        <Tag
                          key={chapter}
                          to={`/chapters/${chapter}`}
                          variant="chapter"
                        >
                          {chapter}
                        </Tag>
                      ))}
                    </div>
                    {!showAllChapters && character.chapter_list.length > 30 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                    )}
                  </div>
                  {character.chapter_list.length > 30 && (
                    <button
                      onClick={() => setShowAllChapters(!showAllChapters)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors border border-blue-200"
                    >
                      <span>
                        {showAllChapters
                          ? 'Show Less'
                          : `Show ${character.chapter_list.length - 30} More Chapters`}
                      </span>
                      <FontAwesomeIcon
                        icon={showAllChapters ? faChevronUp : faChevronDown}
                        className="w-3 h-3"
                      />
                    </button>
                  )}
                </Card>
              )}

              {/* Volumes */}
              {character.volume_list && character.volume_list.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <svg
                          className="w-4 h-4 text-amber-600"
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
                      <h3 className="text-lg font-semibold text-gray-900">
                        Volumes
                      </h3>
                    </div>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
                      {character.volume_list.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {character.volume_list.map((volume) => (
                      <Tag
                        key={volume}
                        to={`/volumes/${volume}`}
                        variant="volume"
                      >
                        Vol. {volume}
                      </Tag>
                    ))}
                  </div>
                </Card>
              )}
            </div>

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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Character Appearances
              </Link>
              <Link
                to="/analytics/character-timeline"
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
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
                Character Timeline
              </Link>
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
                Appearances & Longevity
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    current: 'bg-emerald-100 text-emerald-700',
    former: 'bg-gray-100 text-gray-600',
    defected: 'bg-red-100 text-red-700',
    undercover: 'bg-amber-100 text-amber-700',
    'double agent': 'bg-amber-100 text-amber-700',
    espionage: 'bg-amber-100 text-amber-700',
    temporary: 'bg-blue-100 text-blue-600',
    disbanded: 'bg-gray-100 text-gray-500',
    dissolved: 'bg-gray-100 text-gray-500',
    retired: 'bg-gray-100 text-gray-500',
    resigned: 'bg-gray-100 text-gray-500',
    secret: 'bg-violet-100 text-violet-700',
  }
  return styles[status] || 'bg-gray-100 text-gray-600'
}

function AffiliationsSection({
  affiliations,
}: {
  affiliations: CharacterAffiliation[]
}) {
  // Group by status: current first, then former, then others
  const statusOrder = [
    'current',
    'temporary',
    'undercover',
    'double agent',
    'espionage',
    'secret',
  ]
  const sorted = [...affiliations].sort((a, b) => {
    const ai = statusOrder.indexOf(a.status)
    const bi = statusOrder.indexOf(b.status)
    const aRank = ai >= 0 ? ai : 100
    const bRank = bi >= 0 ? bi : 100
    if (aRank !== bRank) return aRank - bRank
    return a.group_name.localeCompare(b.group_name)
  })

  return (
    <>
      <div className="relative my-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-6 py-2 rounded-full border border-gray-300">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-500"
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
              <h2 className="text-xl font-semibold text-gray-900">
                Affiliations
              </h2>
            </div>
          </span>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 rounded-lg">
              <svg
                className="w-4 h-4 text-rose-600"
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
            <h3 className="text-lg font-semibold text-gray-900">
              Groups & Organizations
            </h3>
          </div>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold">
            {sorted.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sorted.map((aff) => (
            <Tag
              key={`${aff.group_name}-${aff.status}`}
              to={`/affiliations/${encodeURIComponent(aff.group_name)}`}
              variant="affiliation"
            >
              <span className="flex items-center gap-1.5">
                {aff.group_name}
                {aff.sub_group && (
                  <span className="text-rose-400">({aff.sub_group})</span>
                )}
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusBadge(aff.status)}`}
                >
                  {aff.status}
                </span>
              </span>
            </Tag>
          ))}
        </div>
      </Card>
    </>
  )
}

function OccupationsSection({
  occupations,
}: {
  occupations: CharacterOccupation[]
}) {
  const statusOrder = [
    'current',
    'temporary',
    'undercover',
    'double agent',
    'espionage',
    'secret',
  ]
  const sorted = [...occupations].sort((a, b) => {
    const ai = statusOrder.indexOf(a.status)
    const bi = statusOrder.indexOf(b.status)
    const aRank = ai >= 0 ? ai : 100
    const bRank = bi >= 0 ? bi : 100
    if (aRank !== bRank) return aRank - bRank
    return a.role.localeCompare(b.role)
  })

  return (
    <>
      <div className="relative my-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-6 py-2 rounded-full border border-gray-300">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900">
                Occupations
              </h2>
            </div>
          </span>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-100 rounded-lg">
              <svg
                className="w-4 h-4 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Roles & Occupations
            </h3>
          </div>
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 text-sm font-semibold">
            {sorted.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sorted.map((occ) => (
            <Tag
              key={`${occ.role}-${occ.status}`}
              to={`/occupations/${encodeURIComponent(occ.role)}`}
              variant="occupation"
            >
              <span className="flex items-center gap-1.5">
                {occ.role}
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusBadge(occ.status)}`}
                >
                  {occ.status}
                </span>
              </span>
            </Tag>
          ))}
        </div>
      </Card>
    </>
  )
}

export default CharacterDetailPage
