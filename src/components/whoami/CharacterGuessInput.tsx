import { useId, useState, useMemo, useRef, useEffect, useCallback } from 'react'
import type { Character } from '../../types/character'

interface CharacterGuessInputProps {
  characters: Character[]
  onGuess: (characterId: string, characterName: string) => void
  disabled: boolean
}

export default function CharacterGuessInput({
  characters,
  onGuess,
  disabled,
}: CharacterGuessInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const optionId = (i: number) => `${listboxId}-opt-${i}`

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []
    return characters
      .filter((c) => c.name?.toLowerCase().includes(q))
      .slice(0, 50)
  }, [characters, query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    (char: Character) => {
      if (!char.name) return
      onGuess(char.id, char.name)
      setQuery('')
      setOpen(false)
      setHighlightIndex(-1)
    },
    [onGuess]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || filtered.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          handleSelect(filtered[highlightIndex])
        }
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    },
    [open, filtered, highlightIndex, handleSelect]
  )

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-item]')
    items[highlightIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
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
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Guess the character by name"
          aria-autocomplete="list"
          aria-expanded={open && filtered.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={
            open && highlightIndex >= 0 ? optionId(highlightIndex) : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(e.target.value.trim().length > 0)
            setHighlightIndex(-1)
          }}
          onFocus={() => {
            if (query.trim().length > 0) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type character name..."
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {open && filtered.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Character suggestions"
          className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div ref={listRef} className="max-h-48 overflow-y-auto">
            <p className="px-3 py-1.5 text-xs text-gray-600" aria-live="polite">
              {filtered.length} matches
            </p>
            {filtered.map((c, i) => (
              <button
                key={c.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === highlightIndex}
                data-item
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full px-3 py-2 text-left text-sm motion-safe:transition-colors ${
                  i === highlightIndex
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {open && query.trim().length > 0 && filtered.length === 0 && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-600 text-center"
        >
          No characters found
        </div>
      )}
    </div>
  )
}
