import { useState, useMemo } from 'react'
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
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return characters.filter((c) => c.name?.toLowerCase().includes(q))
  }, [characters, search])

  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      {loading ? (
        <div className="h-10 bg-slate-700 rounded-lg animate-pulse" />
      ) : (
        <div className="relative">
          <input
            type="text"
            placeholder="Search characters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-t-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-amber-400 transition-colors"
          />
          <select
            value={selectedId}
            onChange={(e) => {
              onChange(e.target.value)
              setSearch('')
            }}
            size={Math.min(filtered.length + 1, 8)}
            className="w-full bg-slate-700 border border-t-0 border-slate-600 rounded-b-lg text-white text-sm focus:outline-none focus:border-amber-400 transition-colors overflow-y-auto"
          >
            <option value="">— Select character —</option>
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {selectedId && (
        <button
          onClick={() => onChange('')}
          className="mt-1 text-xs text-slate-400 hover:text-amber-400 transition-colors"
        >
          ✕ Clear
        </button>
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
      <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold text-sm border border-amber-400/30">
        {value}
      </span>
    )
  }
  return (
    <span className={`text-sm ${isSolo ? 'text-white' : 'text-slate-300'}`}>
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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link to="/characters" className="hover:text-white transition-colors">
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
          <span className="text-white font-medium">Compare</span>
        </nav>

        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-slate-800 to-blue-900/20" />
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg text-2xl">
                ⚔️
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Character Compare
                </h1>
                <p className="text-slate-400 mt-1">
                  Select two characters to compare their stats side-by-side
                </p>
              </div>
            </div>

            {/* Selectors */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <CharacterSelect
                characters={characters}
                selectedId={char1Id}
                onChange={setChar1Id}
                label="Character 1"
                loading={isLoading}
              />
              <div className="hidden sm:flex items-center pt-6 text-2xl text-slate-500 font-bold select-none">
                vs
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
          <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-4">⚔️</div>
            <p className="text-lg">
              Select at least one character to see their stats
            </p>
          </div>
        )}

        {/* Comparison table */}
        {showTable && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[180px_1fr_1fr] sm:grid-cols-[220px_1fr_1fr] bg-slate-900/70 border-b border-slate-700">
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Stat
              </div>
              <div className="px-4 py-3 text-sm font-semibold text-amber-400 truncate border-l border-slate-700">
                {char1?.name ?? (
                  <span className="text-slate-600 italic">—</span>
                )}
              </div>
              <div className="px-4 py-3 text-sm font-semibold text-blue-400 truncate border-l border-slate-700">
                {char2?.name ?? (
                  <span className="text-slate-600 italic">—</span>
                )}
              </div>
            </div>

            {CATEGORIES.map((cat) => (
              <div key={cat.heading}>
                {/* Category separator */}
                <div className="bg-slate-700/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-500 border-b border-slate-700">
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
                      className={`grid grid-cols-[180px_1fr_1fr] sm:grid-cols-[220px_1fr_1fr] border-b border-slate-700/50 ${isEven ? 'bg-slate-800/30' : 'bg-transparent'}`}
                    >
                      <div className="px-4 py-3 text-sm text-slate-400 font-medium">
                        {field.label}
                      </div>
                      <div className="px-4 py-3 border-l border-slate-700/50">
                        <Cell value={val1} isWinner={win1} isSolo={isSolo} />
                      </div>
                      <div className="px-4 py-3 border-l border-slate-700/50">
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
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
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
