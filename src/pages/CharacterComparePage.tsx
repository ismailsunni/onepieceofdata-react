import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCharacters } from '../services/characterService'
import type { Character } from '../types/character'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBounty(bounty: number | null): string {
  if (bounty === null || bounty === undefined) return '—'
  if (bounty === 0) return '฿0'
  const billions = bounty / 1_000_000_000
  const millions = bounty / 1_000_000
  if (billions >= 1) return `฿${billions.toFixed(billions % 1 === 0 ? 0 : 1)}B`
  if (millions >= 1) return `฿${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M`
  return `฿${bounty.toLocaleString()}`
}

function countBounties(bounties: string | null): number | null {
  if (!bounties || bounties.trim() === '') return null
  // Count comma-separated entries
  return bounties.split(',').filter((s) => s.trim() !== '').length
}

// ─── comparison row types ─────────────────────────────────────────────────────

type CompareField =
  | { type: 'identity'; label: string; getValue: (c: Character) => string }
  | {
      type: 'numeric'
      label: string
      getValue: (c: Character) => number | null
      format?: (c: Character) => string
    }

interface CompareCategory {
  heading: string
  fields: CompareField[]
}

const CATEGORIES: CompareCategory[] = [
  {
    heading: 'Identity',
    fields: [
      { type: 'identity', label: 'Name', getValue: (c) => c.name ?? '—' },
      { type: 'identity', label: 'Origin', getValue: (c) => c.origin ?? '—' },
      { type: 'identity', label: 'Status', getValue: (c) => c.status ?? '—' },
      {
        type: 'identity',
        label: 'Age',
        getValue: (c) => (c.age !== null ? String(c.age) : '—'),
      },
      {
        type: 'identity',
        label: 'Birth Date',
        getValue: (c) => c.birth ?? '—',
      },
      {
        type: 'identity',
        label: 'Blood Type',
        getValue: (c) => c.blood_type ?? '—',
      },
    ],
  },
  {
    heading: 'Power',
    fields: [
      {
        type: 'numeric',
        label: 'Highest Bounty',
        getValue: (c) => c.bounty,
        format: (c) => formatBounty(c.bounty),
      },
      {
        type: 'numeric',
        label: 'Bounty Count',
        getValue: (c) => countBounties(c.bounties),
      },
    ],
  },
  {
    heading: 'Appearances',
    fields: [
      {
        type: 'numeric',
        label: 'Chapter Appearances',
        getValue: (c) => c.appearance_count,
      },
      {
        type: 'numeric',
        label: 'First Appearance (ch)',
        getValue: (c) => c.first_appearance,
      },
      {
        type: 'numeric',
        label: 'Last Appearance (ch)',
        getValue: (c) => c.last_appearance,
      },
      {
        type: 'numeric',
        label: 'Arc Count',
        getValue: (c) => c.arc_list?.length ?? null,
      },
      {
        type: 'numeric',
        label: 'Saga Count',
        getValue: (c) => c.saga_list?.length ?? null,
      },
      {
        type: 'numeric',
        label: 'Cover Appearances',
        getValue: (c) => c.cover_appearance_count,
      },
    ],
  },
]

// ─── sub-components ───────────────────────────────────────────────────────────

interface CharacterSelectProps {
  characters: Character[]
  selectedId: string
  onChange: (id: string) => void
  label: string
  loading: boolean
}

function CharacterSelect({
  characters,
  selectedId,
  onChange,
  label,
  loading,
}: CharacterSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = characters.find((c) => c.id === selectedId) ?? null

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return characters
    return characters.filter((c) => c.name?.toLowerCase().includes(q))
  }, [characters, query])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function handleSelect(id: string) {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  function handleClose() {
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
        {label}
      </label>
      {loading ? (
        <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm text-sm hover:border-amber-400 text-left transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
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
          <span
            className={`flex-1 truncate ${selected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}
          >
            {selected?.name ?? 'Search characters…'}
          </span>
          {selectedId ? (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
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
            </span>
          ) : (
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-200">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder={`Search ${label.toLowerCase()}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <p className="px-4 py-2 text-xs text-gray-400">
              {filtered.length} karakter
            </p>
            <ul>
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleSelect(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      c.id === selectedId
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    {c.id === selectedId && (
                      <svg
                        className="w-4 h-4 text-amber-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-sm ${c.id === selectedId ? 'font-semibold' : ''}`}
                    >
                      {c.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

interface CellProps {
  value: string
  isWinner: boolean
  isSolo: boolean
}

function Cell({ value, isWinner, isSolo }: CellProps) {
  const isEmpty = value === '—'
  if (isEmpty) {
    return <span className="text-slate-500 text-sm">—</span>
  }
  if (isWinner) {
    return (
      <span className="inline-block px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-sm border border-amber-200">
        {value}
      </span>
    )
  }
  return (
    <span className={`text-sm ${isSolo ? 'text-gray-900' : 'text-gray-700'}`}>
      {value}
    </span>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

function CharacterComparePage() {
  const [char1Id, setChar1Id] = useState('')
  const [char2Id, setChar2Id] = useState('')

  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  const char1 = characters.find((c) => c.id === char1Id) ?? null
  const char2 = characters.find((c) => c.id === char2Id) ?? null

  const showTable = char1 !== null || char2 !== null
  const isSolo =
    (char1 !== null && char2 === null) || (char1 === null && char2 !== null)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
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
          <span className="text-gray-900 font-medium">Compare</span>
        </nav>

        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-white" />
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg text-2xl">
                ⚔️
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Character Compare
                </h1>
                <p className="text-gray-500 mt-1">
                  Select two characters to compare their stats side-by-side
                </p>
              </div>
            </div>

            {/* Selectors */}
            <div className="flex flex-col gap-4">
              <CharacterSelect
                characters={characters}
                selectedId={char1Id}
                onChange={setChar1Id}
                label="Character 1"
                loading={isLoading}
              />
              <div className="flex items-center justify-center text-xl text-gray-400 font-bold select-none py-1">
                ⚔️ vs ⚔️
              </div>
              <CharacterSelect
                characters={characters}
                selectedId={char2Id}
                onChange={setChar2Id}
                label="Character 2"
                loading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* No selection state */}
        {!showTable && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">⚔️</div>
            <p className="text-lg">
              Select at least one character to see their stats
            </p>
          </div>
        )}

        {/* Comparison table */}
        {showTable && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Column headers */}
            <div className="grid grid-cols-[180px_1fr_1fr] sm:grid-cols-[220px_1fr_1fr] bg-gray-50 border-b border-gray-200">
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Stat
              </div>
              <div className="px-4 py-3 text-sm font-semibold text-amber-600 truncate border-l border-gray-200">
                {char1?.name ?? <span className="text-gray-400 italic">—</span>}
              </div>
              <div className="px-4 py-3 text-sm font-semibold text-blue-600 truncate border-l border-gray-200">
                {char2?.name ?? <span className="text-gray-400 italic">—</span>}
              </div>
            </div>

            {CATEGORIES.map((cat) => (
              <div key={cat.heading}>
                {/* Category separator */}
                <div className="bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-700 border-b border-amber-100">
                  {cat.heading}
                </div>

                {cat.fields.map((field, fi) => {
                  const isEven = fi % 2 === 0

                  // Compute display values
                  let val1 = '—'
                  let val2 = '—'
                  let win1 = false
                  let win2 = false

                  if (field.type === 'identity') {
                    val1 = char1 ? field.getValue(char1) : '—'
                    val2 = char2 ? field.getValue(char2) : '—'
                  } else {
                    // numeric
                    const n1 = char1 ? field.getValue(char1) : null
                    const n2 = char2 ? field.getValue(char2) : null
                    val1 = char1
                      ? field.format
                        ? field.format(char1)
                        : n1 !== null
                          ? n1.toLocaleString()
                          : '—'
                      : '—'
                    val2 = char2
                      ? field.format
                        ? field.format(char2)
                        : n2 !== null
                          ? n2.toLocaleString()
                          : '—'
                      : '—'

                    if (!isSolo && n1 !== null && n2 !== null) {
                      if (n1 > n2) win1 = true
                      else if (n2 > n1) win2 = true
                    }
                  }

                  return (
                    <div
                      key={field.label}
                      className={`grid grid-cols-[180px_1fr_1fr] sm:grid-cols-[220px_1fr_1fr] border-b border-gray-100 ${isEven ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <div className="px-4 py-3 text-sm text-gray-500 font-medium">
                        {field.label}
                      </div>
                      <div className="px-4 py-3 border-l border-gray-100">
                        <Cell value={val1} isWinner={win1} isSolo={isSolo} />
                      </div>
                      <div className="px-4 py-3 border-l border-gray-100">
                        <Cell value={val2} isWinner={win2} isSolo={isSolo} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        {showTable && !isSolo && (
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              value
            </span>
            <span>= higher (winning) value</span>
          </div>
        )}
      </div>
    </main>
  )
}

export default CharacterComparePage
