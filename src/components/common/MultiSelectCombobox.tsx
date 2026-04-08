import { useState, useRef, useEffect } from 'react'

interface MultiSelectComboboxProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export function MultiSelectCombobox({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Search…',
}: MultiSelectComboboxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered =
    query === ''
      ? options
      : options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    )
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}

      {/* Selected tags */}
      <div
        className="flex flex-wrap gap-1.5 min-h-[38px] px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow"
        onClick={() => setOpen(true)}
      >
        {selected.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md"
          >
            {s}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggle(s)
              }}
              className="hover:text-blue-900"
              aria-label={`Remove ${s}`}
            >
              <svg
                className="w-3 h-3"
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
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
          placeholder={selected.length === 0 ? placeholder : ''}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              No results found
            </li>
          ) : (
            filtered.map((option) => {
              const isSelected = selected.includes(option)
              return (
                <li
                  key={option}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => toggle(option)}
                >
                  <span
                    className={`flex-shrink-0 w-4 h-4 border rounded flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  {option}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
