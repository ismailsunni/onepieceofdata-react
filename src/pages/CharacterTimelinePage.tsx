import { useState, useMemo, useCallback, useTransition } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import CharacterTimelineChart from '../components/CharacterTimelineChart'

// Character presets
const PRESETS = {
  default: {
    label: 'Straw Hat Pirates (Original 5)',
    characters: ['Luffy', 'Nami', 'Zoro', 'Sanji', 'Usopp'],
  },
  strawhat: {
    label: 'All Straw Hat Pirates',
    characters: [
      'Luffy',
      'Zoro',
      'Nami',
      'Usopp',
      'Sanji',
      'Chopper',
      'Robin',
      'Franky',
      'Brook',
      'Jinbe',
    ],
  },
  yonko: {
    label: 'Yonko',
    characters: ['Whitebeard', 'Kaido', 'Big Mom', 'Shanks', 'Blackbeard'],
  },
  shichibukai: {
    label: 'Shichibukai',
    characters: [
      'Mihawk',
      'Crocodile',
      'Doflamingo',
      'Kuma',
      'Boa Hancock',
      'Jinbe',
      'Moria',
    ],
  },
  legends: {
    label: 'Legendary Characters',
    characters: [
      'Gol D. Roger',
      'Whitebeard',
      'Garp',
      'Sengoku',
      'Rayleigh',
      'Rocks D. Xebec',
    ],
  },
  admirals: {
    label: 'Admirals',
    characters: ['Akainu', 'Kizaru', 'Aokiji', 'Fujitora', 'Ryokugyu'],
  },
}

// Default selected characters
const DEFAULT_CHARACTERS = PRESETS.default.characters

function CharacterTimelinePage() {
  const [selectedCharacters, setSelectedCharacters] =
    useState<string[]>(DEFAULT_CHARACTERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()

  // Fetch all characters
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  // Filter characters for selection dropdown
  const filteredCharacters = useMemo(() => {
    if (!searchTerm) return characters
    return characters.filter((char) =>
      char.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [characters, searchTerm])

  // Get data for selected characters
  const selectedCharactersData = useMemo(() => {
    return characters.filter(
      (char) => char.name && selectedCharacters.includes(char.name)
    )
  }, [characters, selectedCharacters])

  const handleCharacterToggle = useCallback((characterName: string) => {
    startTransition(() => {
      setSelectedCharacters((prev) => {
        if (prev.includes(characterName)) {
          return prev.filter((name) => name !== characterName)
        } else {
          return [...prev, characterName]
        }
      })
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    startTransition(() => {
      const allNames = characters
        .filter((char) => char.name)
        .map((char) => char.name as string)
      setSelectedCharacters(allNames)
    })
  }, [characters])

  const handleClearAll = useCallback(() => {
    startTransition(() => {
      setSelectedCharacters([])
    })
  }, [])

  const handlePresetSelect = useCallback(
    (presetKey: keyof typeof PRESETS) => {
      startTransition(() => {
        const preset = PRESETS[presetKey]
        // Find characters that match the preset names (case-insensitive and partial match)
        const matchedCharacters = characters
          .filter((char) => {
            if (!char.name) return false
            return preset.characters.some(
              (presetName) =>
                char.name?.toLowerCase().includes(presetName.toLowerCase()) ||
                presetName
                  .toLowerCase()
                  .includes(char.name?.toLowerCase() || '')
            )
          })
          .map((char) => char.name as string)

        setSelectedCharacters(matchedCharacters)
      })
    },
    [characters]
  )

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

              {/* Preset Selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Character Presets
                </label>
                <select
                  onChange={(e) =>
                    handlePresetSelect(e.target.value as keyof typeof PRESETS)
                  }
                  className="w-full md:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
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
              </div>

              {/* Search + Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[180px]">
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
                    placeholder="Search character name…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                </div>

                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear All
                </button>

                {searchTerm && (
                  <span className="text-xs text-gray-400">
                    {filteredCharacters.length} of {characters.length} shown
                  </span>
                )}
              </div>

              {/* Character Selection Grid */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredCharacters.map((character) => {
                    if (!character.name) return null
                    const isSelected = selectedCharacters.includes(
                      character.name
                    )
                    return (
                      <label
                        key={character.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-teal-50 border border-teal-400 text-teal-800'
                            : 'bg-gray-50 border border-transparent hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleCharacterToggle(character.name as string)
                          }
                          className="accent-teal-600 shrink-0"
                        />
                        <span
                          className="text-sm truncate"
                          title={character.name}
                        >
                          {character.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {filteredCharacters.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No characters found matching "{searchTerm}"
                  </p>
                )}
              </div>
            </div>

            {/* Timeline Chart */}
            {selectedCharactersData.length > 0 ? (
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

export default CharacterTimelinePage
