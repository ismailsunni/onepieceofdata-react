import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchAll } from '../services/searchService'

function Search() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      // Open dropdown when query is long enough
      if (query.length >= 3) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }, 500) // 0.5 seconds delay

    return () => clearTimeout(timer)
  }, [query])

  // Fetch search results
  const { data: results } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchAll(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigate = (path: string) => {
    navigate(path)
    setQuery('')
    setIsOpen(false)
  }

  const hasResults = results && (
    results.characters.length > 0 ||
    results.arcs.length > 0 ||
    results.sagas.length > 0 ||
    results.chapters.length > 0 ||
    results.volumes.length > 0
  )

  return (
    <div ref={searchRef} className="relative w-full md:w-64 lg:w-80">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 3 && results) {
              setIsOpen(true)
            }
          }}
          placeholder="Search..."
          className="w-full px-4 py-2 pl-10 pr-10 rounded-lg bg-blue-500 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-200"
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
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Search Results Dropdown */}
      {isOpen && debouncedQuery.length >= 3 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {!hasResults && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {/* Characters */}
          {results && results.characters.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                Characters
              </div>
              {results.characters.map((character) => (
                <button
                  key={character.name}
                  onClick={() => handleNavigate(`/characters/${character.id}`)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">👤</span>
                  <span>{character.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Sagas */}
          {results && results.sagas.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                Sagas
              </div>
              {results.sagas.map((saga) => (
                <button
                  key={saga.saga_id}
                  onClick={() => handleNavigate(`/sagas/${saga.saga_id}`)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">🌊</span>
                  <span>{saga.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Arcs */}
          {results && results.arcs.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                Arcs
              </div>
              {results.arcs.map((arc) => (
                <button
                  key={arc.arc_id}
                  onClick={() => handleNavigate(`/arcs/${arc.arc_id}`)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">🎭</span>
                  <span>{arc.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Volumes */}
          {results && results.volumes.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                Volumes
              </div>
              {results.volumes.map((volume) => (
                <button
                  key={volume.number}
                  onClick={() => handleNavigate(`/volumes/${volume.number}`)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">📖</span>
                  <div>
                    <div>Volume {volume.number}</div>
                    {volume.title && <div className="text-xs text-gray-500">{volume.title}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Chapters */}
          {results && results.chapters.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                Chapters
              </div>
              {results.chapters.map((chapter) => (
                <button
                  key={chapter.number}
                  onClick={() => handleNavigate(`/chapters/${chapter.number}`)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-lg">📚</span>
                  <div>
                    <div>Chapter {chapter.number}</div>
                    {chapter.title && <div className="text-xs text-gray-500">{chapter.title}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Search
