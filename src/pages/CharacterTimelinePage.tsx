import {
  useState,
  useMemo,
  useCallback,
  useTransition,
  useRef,
  useEffect,
} from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import { fetchArcs } from '../services/arcService'
import { fetchSagas } from '../services/sagaService'
import CharacterTimelineChart from '../components/CharacterTimelineChart'
import { CACHE } from '../constants/cache'

// Character presets (using character IDs/slugs for reliable matching)
export const PRESETS = {
  default: {
    label: 'Straw Hat Pirates (Original 5)',
    ids: ['Monkey_D._Luffy', 'Nami', 'Roronoa_Zoro', 'Sanji', 'Usopp'],
  },
  strawhat: {
    label: 'All Straw Hat Pirates',
    ids: [
      'Monkey_D._Luffy',
      'Roronoa_Zoro',
      'Nami',
      'Usopp',
      'Sanji',
      'Tony_Tony_Chopper',
      'Nico_Robin',
      'Franky',
      'Brook',
      'Jinbe',
    ],
  },
  yonko: {
    label: 'Yonko',
    ids: [
      'Edward_Newgate',
      'Kaidou',
      'Charlotte_Linlin',
      'Shanks',
      'Marshall_D._Teach',
      'Buggy',
      'Monkey_D._Luffy',
    ],
  },
  shichibukai: {
    label: 'Shichibukai',
    ids: [
      'Dracule_Mihawk',
      'Crocodile',
      'Donquixote_Doflamingo',
      'Bartholomew_Kuma',
      'Boa_Hancock',
      'Jinbe',
      'Gecko_Moria',
      'Edward_Weevil',
      'Trafalgar_D._Water_Law',
      'Buggy',
    ],
  },
  legends: {
    label: 'Legendary Characters',
    ids: [
      'Gol_D._Roger',
      'Edward_Newgate',
      'Monkey_D._Garp',
      'Sengoku',
      'Silvers_Rayleigh',
      'Rocks_D._Xebec',
    ],
  },
  admirals: {
    label: 'Admirals',
    ids: ['Sakazuki', 'Borsalino', 'Kuzan', 'Issho', 'Aramaki'],
  },
}

// Default selected characters (by ID)
const DEFAULT_CHARACTERS = PRESETS.default.ids

function CharacterTimelinePage() {
  const [selectedCharacters, setSelectedCharacters] =
    useState<string[]>(DEFAULT_CHARACTERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch all characters
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  const { data: arcs = [] } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
    staleTime: CACHE.REFERENCE_STALE,
  })

  const { data: sagas = [] } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
    staleTime: CACHE.REFERENCE_STALE,
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter characters for selection dropdown
  const filteredCharacters = useMemo(() => {
    if (!searchTerm.trim()) return []
    return characters
      .filter((char) =>
        char.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 30)
  }, [characters, searchTerm])

  // Get data for selected characters
  const selectedCharactersData = useMemo(() => {
    return characters.filter((char) => selectedCharacters.includes(char.id))
  }, [characters, selectedCharacters])

  const handleCharacterToggle = useCallback((characterId: string) => {
    startTransition(() => {
      setSelectedCharacters((prev) => {
        if (prev.includes(characterId)) {
          return prev.filter((id) => id !== characterId)
        } else {
          return [...prev, characterId]
        }
      })
    })
  }, [])

  const handleClearAll = useCallback(() => {
    startTransition(() => {
      setSelectedCharacters([])
    })
  }, [])

  const handlePresetSelect = useCallback((presetKey: keyof typeof PRESETS) => {
    startTransition(() => {
      const preset = PRESETS[presetKey]
      setSelectedCharacters(preset.ids)
    })
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link
            to="/analytics"
            className="hover:text-gray-900 transition-colors"
          >
            Analytics
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
          <span className="text-gray-900 font-medium">Character Timeline</span>
        </nav>
        {/* Hero Section */}
        <div className="relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 md:w-9 md:h-9 text-white"
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
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                  Character Timeline
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Compare character appearances across chapters
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && (
          <div className="space-y-6">
            {/* Character Selection Panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-1">
                  Select Characters
                </h2>
                <p className="text-sm text-gray-600">
                  Choose characters to compare their appearance timelines (
                  {selectedCharacters.length} selected)
                </p>
              </div>

              {/* Preset + Actions row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <select
                  onChange={(e) =>
                    handlePresetSelect(e.target.value as keyof typeof PRESETS)
                  }
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a preset…
                  </option>
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Search with dropdown */}
              <div ref={searchRef} className="relative mb-4">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search and add characters…"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setDropdownOpen(e.target.value.trim().length > 0)
                  }}
                  onFocus={() => {
                    if (searchTerm.trim()) setDropdownOpen(true)
                  }}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setDropdownOpen(false)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Dropdown results */}
                {dropdownOpen && searchTerm.trim() && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                    {filteredCharacters.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No characters found for "{searchTerm}"
                      </div>
                    ) : (
                      filteredCharacters.map((character) => {
                        if (!character.name) return null
                        const isSelected = selectedCharacters.includes(
                          character.id
                        )
                        return (
                          <button
                            key={character.id}
                            onClick={() => handleCharacterToggle(character.id)}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors ${
                              isSelected
                                ? 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{character.name}</span>
                            {isSelected && (
                              <svg
                                className="w-4 h-4 text-teal-600 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected characters table */}
              {selectedCharactersData.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                          Appearances
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                          First App.
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                          Bounty
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                          Remove
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedCharactersData.map((char, idx) => (
                        <tr
                          key={char.id}
                          className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`}
                        >
                          <td className="px-3 py-2">
                            <Link
                              to={`/characters/${char.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {char.name || char.id}
                            </Link>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                char.status === 'Alive'
                                  ? 'bg-green-100 text-green-700'
                                  : char.status === 'Deceased'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {char.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {char.appearance_count || '-'}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {char.first_appearance
                              ? `Ch. ${char.first_appearance}`
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {char.bounty
                              ? `฿${char.bounty.toLocaleString()}`
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleCharacterToggle(char.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              aria-label={`Remove ${char.name}`}
                            >
                              <svg
                                className="w-4 h-4 mx-auto"
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Timeline Chart */}
            {selectedCharactersData.length > 0 ? (
              <>
                <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
                  {isPending && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    </div>
                  )}
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Character Appearance Timeline
                  </h2>
                  <CharacterTimelineChart characters={selectedCharactersData} />
                </div>

                {/* Co-appearance Stats */}
                {selectedCharactersData.length >= 2 && (
                  <CoAppearanceStats
                    characters={selectedCharactersData}
                    arcs={arcs}
                    sagas={sagas}
                  />
                )}
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-center text-gray-500 py-8">
                  Please select at least one character to view the timeline
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function CoAppearanceStats({
  characters,
  arcs,
  sagas,
}: {
  characters: {
    id: string
    name: string | null
    chapter_list: number[] | null
  }[]
  arcs: {
    arc_id: string
    title: string
    start_chapter: number
    end_chapter: number
  }[]
  sagas: {
    saga_id: string
    title: string
    start_chapter: number
    end_chapter: number
  }[]
}) {
  const stats = useMemo(() => {
    // Find chapters where ALL selected characters appear together
    const chapterSets = characters.map((c) => new Set(c.chapter_list || []))
    if (chapterSets.length === 0) return null

    const sharedChapters: number[] = []
    const firstSet = chapterSets[0]
    for (const ch of firstSet) {
      if (chapterSets.every((s) => s.has(ch))) {
        sharedChapters.push(ch)
      }
    }
    sharedChapters.sort((a, b) => a - b)

    // Find arcs that contain at least one shared chapter
    const sharedArcs = arcs.filter((arc) =>
      sharedChapters.some(
        (ch) => ch >= arc.start_chapter && ch <= arc.end_chapter
      )
    )

    // Find sagas that contain at least one shared chapter
    const sharedSagas = sagas.filter((saga) =>
      sharedChapters.some(
        (ch) => ch >= saga.start_chapter && ch <= saga.end_chapter
      )
    )

    return { sharedChapters, sharedArcs, sharedSagas }
  }, [characters, arcs, sagas])

  if (!stats) return null

  const { sharedChapters, sharedArcs, sharedSagas } = stats
  const exampleChapters = sharedChapters.slice(0, 10)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        Co-appearances
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Chapters, arcs, and sagas where all {characters.length} selected
        characters appear together
      </p>

      {sharedChapters.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">
          These characters never appear together in the same chapter.
        </p>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-teal-700">
                {sharedChapters.length}
              </p>
              <p className="text-sm text-teal-600">Shared Chapters</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {sharedArcs.length}
              </p>
              <p className="text-sm text-blue-600">Shared Arcs</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">
                {sharedSagas.length}
              </p>
              <p className="text-sm text-purple-600">Shared Sagas</p>
            </div>
          </div>

          {/* Example chapters */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Example Chapters{' '}
              <span className="font-normal text-gray-400">
                (showing {exampleChapters.length} of {sharedChapters.length})
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {exampleChapters.map((ch) => {
                const arc = arcs.find(
                  (a) => ch >= a.start_chapter && ch <= a.end_chapter
                )
                return (
                  <Link
                    key={ch}
                    to={`/chapters/${ch}`}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                    title={arc ? `Ch. ${ch} (${arc.title})` : `Ch. ${ch}`}
                  >
                    Ch. {ch}
                  </Link>
                )
              })}
              {sharedChapters.length > 10 && (
                <span className="px-2.5 py-1 text-gray-400 text-sm">
                  …and {sharedChapters.length - 10} more
                </span>
              )}
            </div>
          </div>

          {/* Shared arcs */}
          {sharedArcs.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Shared Arcs
              </h3>
              <div className="flex flex-wrap gap-2">
                {sharedArcs.map((arc) => (
                  <Link
                    key={arc.arc_id}
                    to={`/arcs/${arc.arc_id}`}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-lg border border-blue-200 transition-colors"
                  >
                    {arc.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Shared sagas */}
          {sharedSagas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Shared Sagas
              </h3>
              <div className="flex flex-wrap gap-2">
                {sharedSagas.map((saga) => (
                  <Link
                    key={saga.saga_id}
                    to={`/sagas/${saga.saga_id}`}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm rounded-lg border border-purple-200 transition-colors"
                  >
                    {saga.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CharacterTimelinePage
