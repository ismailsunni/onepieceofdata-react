import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SortingState, PaginationState } from '@tanstack/react-table'
import CharacterTable from '../components/CharacterTable'
import { fetchCharacters } from '../services/characterService'
import { fetchArcs } from '../services/arcService'
import { fetchSagas } from '../services/sagaService'
import { CACHE } from '../constants/cache'
import { PAGINATION } from '../constants/pagination'
import { MultiSelectCombobox } from '../components/common/MultiSelectCombobox'
import { RangeSlider } from '../components/common/RangeSlider'

function CharactersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'appearance_count', desc: true },
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: PAGINATION.DEFAULT_PAGE_INDEX,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterMode, setFilterMode] = useState<
    'timeskip' | 'saga' | 'arc' | 'chapter'
  >('timeskip')
  const [selectedSagaTitles, setSelectedSagaTitles] = useState<string[]>([])
  const [selectedArcTitles, setSelectedArcTitles] = useState<string[]>([])
  const [selectedTimeSkip, setSelectedTimeSkip] = useState<string[]>([])
  const [chapterRange, setChapterRange] = useState<[number, number] | null>(
    null
  )

  const TIME_SKIP_CHAPTER = 598

  const globalFilter = searchParams.get('q') || ''
  const setGlobalFilter = (value: string) => {
    setSearchParams(value ? { q: value } : {}, { replace: true })
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const { data: characters = [], isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: fetchCharacters,
  })

  const { data: arcs = [], isLoading: arcsLoading } = useQuery({
    queryKey: ['arcs'],
    queryFn: fetchArcs,
    staleTime: CACHE.REFERENCE_STALE,
    gcTime: CACHE.REFERENCE_GC,
  })

  const { data: sagas = [] } = useQuery({
    queryKey: ['sagas'],
    queryFn: fetchSagas,
    staleTime: CACHE.REFERENCE_STALE,
    gcTime: CACHE.REFERENCE_GC,
  })

  // Build saga mappings: title↔id and title→chapter range
  const { sagaTitleToId, sagaTitles, sagaTitleToRange } = useMemo(() => {
    const titleToId = new Map<string, string>()
    const titleToRange = new Map<string, [number, number]>()
    for (const s of sagas) {
      titleToId.set(s.title, s.saga_id)
      titleToRange.set(s.title, [s.start_chapter, s.end_chapter])
    }
    return {
      sagaTitleToId: titleToId,
      sagaTitles: sagas.map((s) => s.title),
      sagaTitleToRange: titleToRange,
    }
  }, [sagas])

  // Build arc mappings: title→id and title→chapter range
  const { arcTitleToId, arcTitles, arcTitleToRange } = useMemo(() => {
    const titleToId = new Map<string, string>()
    const titleToRange = new Map<string, [number, number]>()
    const titles: string[] = []
    for (const a of arcs) {
      titleToId.set(a.title, a.arc_id)
      titleToRange.set(a.title, [a.start_chapter, a.end_chapter])
      titles.push(a.title)
    }
    return {
      arcTitleToId: titleToId,
      arcTitles: titles,
      arcTitleToRange: titleToRange,
    }
  }, [arcs])

  // Derive chapter min/max from all character chapter_lists
  const { minChapter, maxChapter } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    for (const c of characters) {
      if (c.chapter_list) {
        for (const ch of c.chapter_list) {
          if (ch < min) min = ch
          if (ch > max) max = ch
        }
      }
    }
    return {
      minChapter: min === Infinity ? 0 : min,
      maxChapter: max === -Infinity ? 1000 : max,
    }
  }, [characters])

  const effectiveChapterRange: [number, number] = chapterRange ?? [
    minChapter,
    maxChapter,
  ]

  // Build the chapter ranges covered by selected sagas (for display + filtering)
  const selectedSagaChapterRanges = useMemo(() => {
    return selectedSagaTitles
      .map((t) => {
        const range = sagaTitleToRange.get(t)
        return range ? { title: t, start: range[0], end: range[1] } : null
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.start - b.start)
  }, [selectedSagaTitles, sagaTitleToRange])

  // Build the chapter ranges covered by selected arcs (for display + filtering)
  const selectedArcChapterRanges = useMemo(() => {
    return selectedArcTitles
      .map((t) => {
        const range = arcTitleToRange.get(t)
        return range ? { title: t, start: range[0], end: range[1] } : null
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.start - b.start)
  }, [selectedArcTitles, arcTitleToRange])

  // Convert selected saga titles to IDs for filtering
  const selectedSagaIds = useMemo(
    () =>
      selectedSagaTitles
        .map((t) => sagaTitleToId.get(t))
        .filter((id): id is string => id != null),
    [selectedSagaTitles, sagaTitleToId]
  )

  // Convert selected arc titles to IDs for filtering
  const selectedArcIds = useMemo(
    () =>
      selectedArcTitles
        .map((t) => arcTitleToId.get(t))
        .filter((id): id is string => id != null),
    [selectedArcTitles, arcTitleToId]
  )

  // Helper: check if a chapter falls within any of the given ranges
  const makeChapterRangeChecker = (
    ranges: { start: number; end: number }[]
  ) => {
    if (ranges.length === 0) return () => false
    return (ch: number) => ranges.some((r) => ch >= r.start && ch <= r.end)
  }

  // Helper: build time skip chapter ranges from selection
  const timeSkipChapterRanges = useMemo(() => {
    const ranges: { start: number; end: number }[] = []
    if (selectedTimeSkip.includes('Before Time Skip')) {
      ranges.push({ start: 0, end: TIME_SKIP_CHAPTER - 1 })
    }
    if (selectedTimeSkip.includes('After Time Skip')) {
      ranges.push({ start: TIME_SKIP_CHAPTER, end: Infinity })
    }
    return ranges
  }, [selectedTimeSkip])

  // Filter characters and recalculate appearance_count based on active filter mode
  const filteredCharacters = useMemo(() => {
    const filterByChapterRanges = (
      ranges: { start: number; end: number }[],
      membershipFilter?: (c: (typeof characters)[0]) => boolean
    ) => {
      const isInRange = makeChapterRangeChecker(ranges)
      const result = membershipFilter
        ? characters.filter(membershipFilter)
        : characters
      return result
        .map((c) => {
          const chaptersInRange = c.chapter_list?.filter(isInRange) ?? []
          if (chaptersInRange.length === 0) return null
          return {
            ...c,
            appearance_count: chaptersInRange.length,
            chapter_list: chaptersInRange,
          }
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)
    }

    if (filterMode === 'saga' && selectedSagaIds.length > 0) {
      return filterByChapterRanges(
        selectedSagaChapterRanges,
        (c) => c.saga_list?.some((s) => selectedSagaIds.includes(s)) ?? false
      )
    }

    if (filterMode === 'arc' && selectedArcIds.length > 0) {
      return filterByChapterRanges(
        selectedArcChapterRanges,
        (c) => c.arc_list?.some((a) => selectedArcIds.includes(a)) ?? false
      )
    }

    if (filterMode === 'chapter' && chapterRange) {
      const [lo, hi] = chapterRange
      return filterByChapterRanges([{ start: lo, end: hi }])
    }

    if (filterMode === 'timeskip' && selectedTimeSkip.length > 0) {
      return filterByChapterRanges(timeSkipChapterRanges)
    }

    return characters
  }, [
    characters,
    filterMode,
    selectedSagaIds,
    selectedSagaChapterRanges,
    selectedArcIds,
    selectedArcChapterRanges,
    chapterRange,
    selectedTimeSkip,
    timeSkipChapterRanges,
  ])

  const hasActiveFilters =
    (filterMode === 'saga' && selectedSagaTitles.length > 0) ||
    (filterMode === 'arc' && selectedArcTitles.length > 0) ||
    (filterMode === 'chapter' && chapterRange !== null) ||
    (filterMode === 'timeskip' && selectedTimeSkip.length > 0)

  const clearFilters = () => {
    setSelectedSagaTitles([])
    setSelectedArcTitles([])
    setSelectedTimeSkip([])
    setChapterRange(null)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  // Summary of active filter's chapter range for collapsed display
  const activeFilterChapterSummary = useMemo(() => {
    if (!hasActiveFilters) return ''
    if (filterMode === 'saga' && selectedSagaChapterRanges.length > 0) {
      return `Ch. ${selectedSagaChapterRanges.map((r) => `${r.start}–${r.end}`).join(', ')}`
    }
    if (filterMode === 'arc' && selectedArcChapterRanges.length > 0) {
      return `Ch. ${selectedArcChapterRanges.map((r) => `${r.start}–${r.end}`).join(', ')}`
    }
    if (filterMode === 'chapter' && chapterRange) {
      return `Ch. ${chapterRange[0]}–${chapterRange[1]}`
    }
    if (filterMode === 'timeskip' && selectedTimeSkip.length > 0) {
      return `Ch. ${selectedTimeSkip
        .sort()
        .map((s) =>
          s === 'After Time Skip'
            ? `${TIME_SKIP_CHAPTER}+`
            : `1–${TIME_SKIP_CHAPTER - 1}`
        )
        .join(', ')}`
    }
    return ''
  }, [
    hasActiveFilters,
    filterMode,
    selectedSagaChapterRanges,
    selectedArcChapterRanges,
    chapterRange,
    selectedTimeSkip,
  ])

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
          <span className="text-gray-900 font-medium">Characters</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Characters
            </h1>
            <p className="text-lg text-gray-600">
              Explore the vast world of One Piece characters
            </p>
          </div>
          <Link
            to="/characters/compare"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            ⚔️ Compare Characters
          </Link>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative max-w-md">
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
              placeholder="Search characters by name…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="mb-6">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${filtersOpen ? 'rotate-90' : ''}`}
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
            Advanced Filters
            {hasActiveFilters && activeFilterChapterSummary && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {activeFilterChapterSummary}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div className="mt-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-3">
              {/* Filter by Time Skip */}
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'timeskip'}
                  onChange={() => {
                    setFilterMode('timeskip')
                    clearFilters()
                  }}
                  className="w-4 h-4 text-blue-600 flex-shrink-0"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0 w-28">
                  Time Skip
                </span>
                <div
                  className={`flex-1 flex items-center gap-4 ${
                    filterMode !== 'timeskip'
                      ? 'opacity-40 pointer-events-none'
                      : ''
                  }`}
                >
                  <div className="flex-1">
                    <MultiSelectCombobox
                      label=""
                      options={['Before Time Skip', 'After Time Skip']}
                      selected={selectedTimeSkip}
                      onChange={(v) => {
                        setSelectedTimeSkip(v)
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                      }}
                      placeholder="Select…"
                    />
                  </div>
                  {selectedTimeSkip.length > 0 && (
                    <p className="text-sm text-blue-600 font-semibold flex-shrink-0">
                      Ch.{' '}
                      {selectedTimeSkip
                        .sort()
                        .map((s) =>
                          s === 'After Time Skip'
                            ? `${TIME_SKIP_CHAPTER}+`
                            : `1–${TIME_SKIP_CHAPTER - 1}`
                        )
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Filter by Saga */}
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'saga'}
                  onChange={() => {
                    setFilterMode('saga')
                    clearFilters()
                  }}
                  className="w-4 h-4 text-blue-600 flex-shrink-0"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0 w-28">
                  Saga
                </span>
                <div
                  className={`flex-1 flex items-center gap-4 ${
                    filterMode !== 'saga'
                      ? 'opacity-40 pointer-events-none'
                      : ''
                  }`}
                >
                  <div className="flex-1">
                    <MultiSelectCombobox
                      label=""
                      options={sagaTitles}
                      selected={selectedSagaTitles}
                      onChange={(v) => {
                        setSelectedSagaTitles(v)
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                      }}
                      placeholder="Select sagas…"
                    />
                  </div>
                  {selectedSagaChapterRanges.length > 0 && (
                    <p className="text-sm text-blue-600 font-semibold flex-shrink-0">
                      Ch.{' '}
                      {selectedSagaChapterRanges
                        .map((r) => `${r.start}–${r.end}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Filter by Arc */}
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'arc'}
                  onChange={() => {
                    setFilterMode('arc')
                    clearFilters()
                  }}
                  className="w-4 h-4 text-blue-600 flex-shrink-0"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0 w-28">
                  Arc
                </span>
                <div
                  className={`flex-1 flex items-center gap-4 ${
                    filterMode !== 'arc' ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex-1">
                    <MultiSelectCombobox
                      label=""
                      options={arcTitles}
                      selected={selectedArcTitles}
                      onChange={(v) => {
                        setSelectedArcTitles(v)
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                      }}
                      placeholder="Select arcs…"
                    />
                  </div>
                  {selectedArcChapterRanges.length > 0 && (
                    <p className="text-sm text-blue-600 font-semibold flex-shrink-0">
                      Ch.{' '}
                      {selectedArcChapterRanges
                        .map((r) => `${r.start}–${r.end}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Filter by Chapter Range */}
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'chapter'}
                  onChange={() => {
                    setFilterMode('chapter')
                    clearFilters()
                  }}
                  className="w-4 h-4 text-blue-600 flex-shrink-0"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-shrink-0 w-28">
                  Chapter Range
                </span>
                <div
                  className={`flex-1 flex items-center gap-3 ${
                    filterMode !== 'chapter'
                      ? 'opacity-40 pointer-events-none'
                      : ''
                  }`}
                >
                  <input
                    type="number"
                    min={minChapter}
                    max={effectiveChapterRange[1]}
                    value={effectiveChapterRange[0]}
                    onChange={(e) => {
                      const v = Math.max(
                        minChapter,
                        Math.min(
                          Number(e.target.value),
                          effectiveChapterRange[1]
                        )
                      )
                      setChapterRange([v, effectiveChapterRange[1]])
                      setPagination((p) => ({ ...p, pageIndex: 0 }))
                    }}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex-1">
                    <RangeSlider
                      label=""
                      min={minChapter}
                      max={maxChapter}
                      value={effectiveChapterRange}
                      onChange={(v) => setChapterRange(v)}
                      onCommit={(v) => {
                        setChapterRange(v)
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                      }}
                    />
                  </div>
                  <input
                    type="number"
                    min={effectiveChapterRange[0]}
                    max={maxChapter}
                    value={effectiveChapterRange[1]}
                    onChange={(e) => {
                      const v = Math.min(
                        maxChapter,
                        Math.max(
                          Number(e.target.value),
                          effectiveChapterRange[0]
                        )
                      )
                      setChapterRange([effectiveChapterRange[0], v])
                      setPagination((p) => ({ ...p, pageIndex: 0 }))
                    }}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading || arcsLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      'Name',
                      'Origin',
                      'Region',
                      'Status',
                      'Appearances',
                      'First Appearance',
                      'Bounty',
                      'Age',
                      'Blood Type',
                    ].map((header) => (
                      <th key={header} className="px-4 py-3 text-left">
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="bg-white">
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <CharacterTable
              characters={filteredCharacters}
              arcs={arcs}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              pagination={pagination}
              onPaginationChange={setPagination}
              isFiltered={hasActiveFilters}
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default CharactersPage
