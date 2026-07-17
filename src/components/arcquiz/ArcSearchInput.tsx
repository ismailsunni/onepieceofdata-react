import { useId, useState, useMemo, useRef, useEffect, useCallback } from 'react'
import type { ArcOption } from '../../types/arcQuiz'

interface ArcSearchInputProps {
  arcs: ArcOption[]
  onGuess: (arcId: string) => void
  disabled: boolean
}

export default function ArcSearchInput({
  arcs,
  onGuess,
  disabled,
}: ArcSearchInputProps) {
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const optionId = (i: number) => `${listboxId}-opt-${i}`

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return arcs
    return arcs.filter((a) => a.title.toLowerCase().includes(q))
  }, [arcs, query])

  const handleSelect = useCallback(
    (arc: ArcOption) => {
      onGuess(arc.arc_id)
    },
    [onGuess]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filtered.length === 0) return

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
      }
    },
    [filtered, highlightIndex, handleSelect]
  )

  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[data-item]')
    items[highlightIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  return (
    <div className="w-full max-w-sm">
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
          type="text"
          role="combobox"
          aria-label="Filter arcs by name"
          aria-autocomplete="list"
          aria-expanded={filtered.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightIndex >= 0 ? optionId(highlightIndex) : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlightIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Filter arcs…"
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div
        id={listboxId}
        role="listbox"
        aria-label="Arcs"
        className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden"
      >
        <p
          className="px-3 py-1.5 text-xs text-gray-600 border-b border-gray-100"
          aria-live="polite"
        >
          {filtered.length} {query.trim() ? 'matches' : 'arcs'}
        </p>
        <div ref={listRef} className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p role="status" className="p-3 text-sm text-gray-600 text-center">
              No arcs found
            </p>
          ) : (
            filtered.map((a, i) => (
              <button
                key={a.arc_id}
                id={optionId(i)}
                role="option"
                aria-selected={i === highlightIndex}
                data-item
                type="button"
                onClick={() => handleSelect(a)}
                className={`w-full px-3 py-2.5 text-left text-sm motion-safe:transition-colors ${
                  i === highlightIndex
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {a.title}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
