import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAllDevilFruits } from '../services/devilFruitService'
import { fetchCharacters } from '../services/characterService'
import SortableTable, { Column } from '../components/common/SortableTable'
import type { CharacterDevilFruit } from '../types/devilFruit'

const UNKNOWN_TYPE = '????'

function DevilFruitsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [subTypeFilter, setSubTypeFilter] = useState<string>('all')
  const [artificialFilter, setArtificialFilter] = useState<
    'all' | 'natural' | 'artificial'
  >('all')

  const { data: devilFruits = [], isLoading } = useQuery({
    queryKey: ['all-devil-fruits'],
    queryFn: fetchAllDevilFruits,
    staleTime: 10 * 60 * 1000,
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['all-characters'],
    queryFn: fetchCharacters,
    staleTime: 10 * 60 * 1000,
  })

  const characterStatusById = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const c of characters) {
      map.set(c.id, c.status ?? null)
    }
    return map
  }, [characters])

  const isDeceased = (characterId: string) => {
    const status = characterStatusById.get(characterId)
    return status?.toLowerCase() === 'deceased'
  }

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const fruit of devilFruits) {
      const key = fruit.fruit_type || UNKNOWN_TYPE
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [devilFruits])

  const fruitTypes = useMemo(
    () =>
      Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type]) => type),
    [typeCounts]
  )

  const subTypeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    if (typeFilter === 'all') return counts
    for (const fruit of devilFruits) {
      const typeKey = fruit.fruit_type || UNKNOWN_TYPE
      if (typeKey === typeFilter && fruit.fruit_sub_type) {
        counts.set(
          fruit.fruit_sub_type,
          (counts.get(fruit.fruit_sub_type) ?? 0) + 1
        )
      }
    }
    return counts
  }, [devilFruits, typeFilter])

  const subTypes = useMemo(
    () =>
      Array.from(subTypeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([sub]) => sub),
    [subTypeCounts]
  )

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type)
    setSubTypeFilter('all')
  }

  const filtered = useMemo(() => {
    let result = devilFruits
    if (typeFilter !== 'all') {
      result = result.filter(
        (f) => (f.fruit_type || UNKNOWN_TYPE) === typeFilter
      )
      if (subTypeFilter !== 'all') {
        result = result.filter((f) => f.fruit_sub_type === subTypeFilter)
      }
    }
    if (artificialFilter === 'artificial') {
      result = result.filter((f) => f.is_artificial)
    } else if (artificialFilter === 'natural') {
      result = result.filter((f) => !f.is_artificial)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) =>
          f.fruit_name.toLowerCase().includes(q) ||
          f.english_name?.toLowerCase().includes(q) ||
          f.meaning?.toLowerCase().includes(q) ||
          f.fruit_sub_type?.toLowerCase().includes(q) ||
          f.fruit_model?.toLowerCase().includes(q) ||
          f.character_id.replace(/_/g, ' ').toLowerCase().includes(q)
      )
    }
    return result
  }, [devilFruits, search, typeFilter, subTypeFilter, artificialFilter])

  const artificialCount = useMemo(
    () => devilFruits.filter((f) => f.is_artificial).length,
    [devilFruits]
  )

  const formatCharacterName = (id: string) =>
    id
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

  const columns: Column<CharacterDevilFruit>[] = [
    {
      key: 'fruit_name',
      label: 'Fruit Name',
      sortValue: (row) => row.fruit_name,
      render: (row) => (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900">{row.fruit_name}</span>
          {row.is_artificial && (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700"
              title="Artificial devil fruit"
            >
              Artificial
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'fruit_model',
      label: 'Model',
      sortValue: (row) => row.fruit_model ?? '',
      render: (row) =>
        row.fruit_model ? (
          <span className="text-gray-700 text-sm">{row.fruit_model}</span>
        ) : (
          <span className="text-gray-300">&ndash;</span>
        ),
    },
    {
      key: 'meaning',
      label: 'Meaning',
      sortValue: (row) => row.meaning ?? '',
      render: (row) =>
        row.meaning ? (
          <span className="text-gray-600 text-sm">{row.meaning}</span>
        ) : (
          <span className="text-gray-300">&ndash;</span>
        ),
    },
    {
      key: 'fruit_type',
      label: 'Type',
      sortValue: (row) => row.fruit_type ?? '',
      render: (row) =>
        row.fruit_type ? (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              row.fruit_type === 'Logia'
                ? 'bg-sky-100 text-sky-700'
                : row.fruit_type === 'Zoan'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
            }`}
          >
            {row.fruit_type}
          </span>
        ) : (
          <span className="text-gray-300">&ndash;</span>
        ),
    },
    {
      key: 'fruit_sub_type',
      label: 'Sub-type',
      sortValue: (row) => row.fruit_sub_type ?? '',
      render: (row) =>
        row.fruit_sub_type ? (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {row.fruit_sub_type}
          </span>
        ) : (
          <span className="text-gray-300">&ndash;</span>
        ),
    },
    {
      key: 'character_id',
      label: 'User',
      sortValue: (row) => formatCharacterName(row.character_id),
      render: (row) => {
        const deceased = isDeceased(row.character_id)
        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/characters/${row.character_id}`}
              className={`font-medium hover:underline ${
                deceased
                  ? 'text-red-700 hover:text-red-900'
                  : 'text-blue-600 hover:text-blue-800'
              }`}
              title={deceased ? 'Deceased' : undefined}
            >
              {formatCharacterName(row.character_id)}
            </Link>
            {deceased && (
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold"
                title="Deceased"
                aria-label="Deceased"
              >
                ✕
              </span>
            )}
          </div>
        )
      },
    },
  ]

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
          <span className="text-gray-900 font-medium">Devil Fruits</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Devil Fruits
          </h1>
          <p className="text-lg text-gray-600">
            All known Devil Fruits and their users
            {devilFruits.length > 0 && (
              <span className="ml-2 text-sm text-gray-400">
                ({devilFruits.length} fruits)
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-md flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
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
              type="text"
              placeholder="Search fruits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleTypeFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({devilFruits.length})
            </button>
            {fruitTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeFilter(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? type === 'Logia'
                      ? 'bg-sky-600 text-white'
                      : type === 'Zoan'
                        ? 'bg-green-600 text-white'
                        : type === 'Paramecia'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {type} ({typeCounts.get(type) ?? 0})
              </button>
            ))}
          </div>
        </div>

        {/* Origin filter */}
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 mr-1">Origin:</span>
          <button
            onClick={() => setArtificialFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              artificialFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({devilFruits.length})
          </button>
          <button
            onClick={() => setArtificialFilter('natural')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              artificialFilter === 'natural'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Natural ({devilFruits.length - artificialCount})
          </button>
          <button
            onClick={() => setArtificialFilter('artificial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              artificialFilter === 'artificial'
                ? 'bg-orange-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Artificial ({artificialCount})
          </button>
        </div>

        {/* Sub-type filters */}
        {typeFilter !== 'all' && subTypes.length > 0 && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 mr-1">Sub-type:</span>
            <button
              onClick={() => setSubTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                subTypeFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({typeCounts.get(typeFilter) ?? 0})
            </button>
            {subTypes.map((sub) => (
              <button
                key={sub}
                onClick={() => setSubTypeFilter(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  subTypeFilter === sub
                    ? 'bg-gray-700 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {sub} ({subTypeCounts.get(sub) ?? 0})
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <SortableTable<CharacterDevilFruit>
              columns={columns}
              data={filtered}
              defaultSortField="fruit_name"
              defaultSortDirection="asc"
              rowKey={(row) => `${row.character_id}-${row.fruit_name}`}
              maxHeight="700px"
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default DevilFruitsPage
