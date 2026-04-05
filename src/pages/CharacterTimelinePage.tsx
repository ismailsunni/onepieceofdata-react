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
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Select Characters
                </h2>
                <p className="text-sm text-gray-600">
                  Choose characters to compare their appearance timelines (
                  {selectedCharacters.length} selected)
                </p>
              </div>

              {/* Preset Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Character Presets
                </label>
                <select
                  onChange={(e) =>
                    handlePresetSelect(e.target.value as keyof typeof PRESETS)
                  }
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a preset...
                  </option>
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Characters
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to filter characters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
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
                  )}
                </div>
                {searchTerm && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing {filteredCharacters.length} of {characters.length}{' '}
                    characters
                  </p>
                )}
              </div>

              {/* Character Selection Grid */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredCharacters.map((character) => {
                    if (!character.name) return null
                    const isSelected = selectedCharacters.includes(
                      character.name
                    )
                    return (
                      <label
                        key={character.id}
                        className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleCharacterToggle(character.name as string)
                          }
                          className="mr-2"
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
              <div className="bg-white rounded-lg shadow-md p-6 relative">
                {isPending && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Character Appearance Timeline
                </h2>
                <CharacterTimelineChart characters={selectedCharactersData} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
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
