import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  OnChangeFn,
  PaginationState,
  ColumnFiltersState,
  VisibilityState,
  Column,
} from '@tanstack/react-table'
import { Character } from '../types/character'
import { Arc } from '../types/arc'
import { usePersistedState } from '../hooks/usePersistedState'

/* ── Filter popover wrapper ── */

function FilterPopover({
  column,
  children,
}: {
  column: Column<Character, unknown>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = column.getFilterValue() !== undefined

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className={`p-0.5 rounded transition-colors ${
          isActive
            ? 'text-blue-600 hover:text-blue-700'
            : 'text-gray-300 hover:text-gray-500'
        }`}
        title="Filter column"
        aria-label="Filter column"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-3 min-w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}

/* ── Filter content components ── */

function RangeFilterContent({
  value,
  onChange,
}: {
  value: [number | undefined, number | undefined]
  onChange: (val: [number | undefined, number | undefined]) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase">Range</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value[0] ?? ''}
          onChange={(e) =>
            onChange([
              e.target.value === '' ? undefined : Number(e.target.value),
              value[1],
            ])
          }
          placeholder="Min"
          className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-gray-400 text-sm">-</span>
        <input
          type="number"
          value={value[1] ?? ''}
          onChange={(e) =>
            onChange([
              value[0],
              e.target.value === '' ? undefined : Number(e.target.value),
            ])
          }
          placeholder="Max"
          className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {(value[0] !== undefined || value[1] !== undefined) && (
        <button
          onClick={() => onChange([undefined, undefined])}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  )
}

function MultiSelectFilterContent({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase">Filter</p>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-h-48 overflow-auto space-y-0.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt)
          return (
            <label
              key={opt}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(opt)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {opt || '(empty)'}
            </label>
          )
        })}
      </div>
    </div>
  )
}

interface CharacterTableProps {
  characters: Character[]
  arcs: Arc[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  globalFilter: string
  onGlobalFilterChange: (filter: string) => void
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  isFiltered?: boolean
}

const columnHelper = createColumnHelper<Character>()

const rangeFilter = (
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: [number | undefined, number | undefined]
): boolean => {
  const [min, max] = filterValue
  if (min === undefined && max === undefined) return true
  const raw = row.getValue(columnId)
  const val = Array.isArray(raw) ? raw.length : (raw as number | null)
  if (val == null) return false
  if (min !== undefined && val < min) return false
  if (max !== undefined && val > max) return false
  return true
}

const multiselectFilter = (
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: string[]
): boolean => {
  if (!filterValue || filterValue.length === 0) return true
  const val = (row.getValue(columnId) as string | null) ?? ''
  return filterValue.includes(val)
}

const booleanFilter = (
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: string[]
): boolean => {
  if (!filterValue || filterValue.length === 0) return true
  const val = row.getValue(columnId) ? 'Yes' : 'No'
  return filterValue.includes(val)
}

const renderHakiCell = (has: boolean | null) =>
  has ? (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"
      title="Yes"
    >
      ✓
    </span>
  ) : (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 text-gray-300 text-xs"
      title="No"
    >
      &ndash;
    </span>
  )

// Column filter types
type ColumnFilterMeta = {
  filterType?: 'range' | 'multiselect' | 'boolean'
  label?: string
}

const COLUMN_STORAGE_KEY = 'characters-column-visibility'

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  haki_observation: false,
  haki_armament: false,
  haki_conqueror: false,
  volume_appearance_count: false,
  arc_list: false,
  birth_date: false,
  blood_type: false,
  chapter_appearance_pct: false,
  volume_appearance_pct: false,
}

function CharacterTable({
  characters,
  arcs,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  pagination,
  onPaginationChange,
  isFiltered = false,
}: CharacterTableProps) {
  const navigate = useNavigate()
  const [columnFilters, setColumnFilters] =
    usePersistedState<ColumnFiltersState>('characters-column-filters', [])
  const [columnVisibility, setColumnVisibility] =
    usePersistedState<VisibilityState>(
      COLUMN_STORAGE_KEY,
      DEFAULT_COLUMN_VISIBILITY
    )
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false)
  const columnsMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        columnsMenuRef.current &&
        !columnsMenuRef.current.contains(e.target as Node)
      ) {
        setColumnsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Total chapters/volumes published (derived from max number seen across characters)
  const { totalChapters, totalVolumes } = useMemo(() => {
    let maxCh = 0
    let maxVol = 0
    for (const c of characters) {
      if (c.chapter_list) {
        for (const n of c.chapter_list) if (n > maxCh) maxCh = n
      }
      if (c.volume_list) {
        for (const n of c.volume_list) if (n > maxVol) maxVol = n
      }
    }
    return { totalChapters: maxCh, totalVolumes: maxVol }
  }, [characters])

  const formatPct = (count: number | null | undefined, total: number) => {
    if (!count || !total) return '-'
    const pct = (count / total) * 100
    return pct >= 10 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`
  }

  // Create arc lookup map
  const arcMap = useMemo(() => {
    const map = new Map<string, string>()
    arcs.forEach((arc) => {
      map.set(arc.arc_id, arc.title)
    })
    return map
  }, [arcs])

  // Extract unique values for multiselect columns
  const uniqueValues = useMemo(() => {
    const regions = new Set<string>()
    const statuses = new Set<string>()
    const bloodTypes = new Set<string>()
    for (const c of characters) {
      if (c.origin_region) regions.add(c.origin_region)
      if (c.status) statuses.add(c.status)
      if (c.blood_type) bloodTypes.add(c.blood_type)
    }
    return {
      origin_region: Array.from(regions).sort(),
      status: Array.from(statuses).sort(),
      blood_type: Array.from(bloodTypes).sort(),
    }
  }, [characters])

  // Define table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const name = info.getValue()
          if (!name) return '-'

          return <span className="font-medium text-blue-600">{name}</span>
        },
      }),
      columnHelper.accessor('origin_region', {
        header: 'Region',
        cell: (info) => info.getValue() || '-',
        filterFn: multiselectFilter as never,
        meta: { filterType: 'multiselect' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                status === 'Alive'
                  ? 'bg-green-100 text-green-700'
                  : status === 'Deceased'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {status || 'Unknown'}
            </span>
          )
        },
        filterFn: multiselectFilter as never,
        meta: { filterType: 'multiselect' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('appearance_count', {
        header: () => (
          <span
            className={
              isFiltered
                ? 'px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded'
                : ''
            }
            title={
              isFiltered
                ? 'Filtered: counts only chapters in selected range'
                : undefined
            }
          >
            Appearance Count
          </span>
        ),
        cell: (info) => info.getValue() || '-',
        filterFn: rangeFilter as never,
        meta: {
          filterType: 'range',
          label: 'Appearance Count',
        } as ColumnFilterMeta,
      }),
      columnHelper.accessor('saga_list', {
        header: 'Sagas',
        cell: (info) => {
          const sagas = info.getValue()
          return sagas?.length || '-'
        },
        sortingFn: (a, b) =>
          (a.original.saga_list?.length ?? 0) -
          (b.original.saga_list?.length ?? 0),
        filterFn: rangeFilter as never,
        meta: { filterType: 'range' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('cover_appearance_count', {
        header: 'Cover App.',
        cell: (info) => {
          const count = info.getValue()
          return count ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              {count}
            </span>
          ) : (
            '-'
          )
        },
        filterFn: rangeFilter as never,
        meta: { filterType: 'range' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('first_appearance', {
        header: 'First App.',
        cell: (info) => {
          const chapter = info.getValue()
          const character = info.row.original

          if (!chapter) return '-'

          // Find the arc where this character first appeared
          let arcName = ''
          if (character.arc_list && character.arc_list.length > 0) {
            // Get the first arc from the arc_list
            const firstArcId = character.arc_list[0]
            arcName = arcMap.get(firstArcId) || ''
          }

          return (
            <div className="flex flex-col">
              <span>Ch. {chapter}</span>
              {arcName && (
                <span className="text-xs text-gray-500 mt-0.5">{arcName}</span>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('last_appearance', {
        header: 'Last App.',
        cell: (info) => {
          const chapter = info.getValue()
          const character = info.row.original
          if (!chapter) return '-'
          let arcName = ''
          if (character.arc_list && character.arc_list.length > 0) {
            const lastArcId = character.arc_list[character.arc_list.length - 1]
            arcName = arcMap.get(lastArcId) || ''
          }
          return (
            <div className="flex flex-col">
              <span>Ch. {chapter}</span>
              {arcName && (
                <span className="text-xs text-gray-500 mt-0.5">{arcName}</span>
              )}
            </div>
          )
        },
        filterFn: rangeFilter as never,
        meta: {
          filterType: 'range',
          label: 'Last Appearance',
        } as ColumnFilterMeta,
      }),
      columnHelper.accessor('volume_appearance_count', {
        header: 'Volumes',
        cell: (info) => info.getValue() || '-',
        filterFn: rangeFilter as never,
        meta: {
          filterType: 'range',
          label: 'Volume Count',
        } as ColumnFilterMeta,
      }),
      columnHelper.accessor(
        (row) =>
          totalChapters && row.appearance_count
            ? row.appearance_count / totalChapters
            : 0,
        {
          id: 'chapter_appearance_pct',
          header: 'Chapter %',
          cell: (info) =>
            formatPct(info.row.original.appearance_count, totalChapters),
          meta: { label: 'Chapter Appearance %' } as ColumnFilterMeta,
        }
      ),
      columnHelper.accessor(
        (row) =>
          totalVolumes && row.volume_appearance_count
            ? row.volume_appearance_count / totalVolumes
            : 0,
        {
          id: 'volume_appearance_pct',
          header: 'Volume %',
          cell: (info) =>
            formatPct(info.row.original.volume_appearance_count, totalVolumes),
          meta: { label: 'Volume Appearance %' } as ColumnFilterMeta,
        }
      ),
      columnHelper.accessor('arc_list', {
        header: 'Arcs',
        cell: (info) => info.getValue()?.length || '-',
        sortingFn: (a, b) =>
          (a.original.arc_list?.length ?? 0) -
          (b.original.arc_list?.length ?? 0),
        filterFn: rangeFilter as never,
        meta: { filterType: 'range', label: 'Arc Count' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('bounty', {
        header: 'Bounty',
        cell: (info) => {
          const bounty = info.getValue()
          return bounty ? `฿${bounty.toLocaleString()}` : '-'
        },
        filterFn: rangeFilter as never,
        meta: { filterType: 'range' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('age', {
        header: 'Age',
        cell: (info) => info.getValue() || '-',
        filterFn: rangeFilter as never,
        meta: { filterType: 'range' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('birth_date', {
        header: 'Birth Date',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('blood_type', {
        header: 'Blood Type',
        cell: (info) => info.getValue() || '-',
        filterFn: multiselectFilter as never,
        meta: { filterType: 'multiselect' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('haki_observation', {
        header: 'Observation',
        cell: (info) => renderHakiCell(info.getValue()),
        sortingFn: (a, b) =>
          (a.original.haki_observation ? 1 : 0) -
          (b.original.haki_observation ? 1 : 0),
        filterFn: booleanFilter as never,
        meta: { filterType: 'boolean' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('haki_armament', {
        header: 'Armament',
        cell: (info) => renderHakiCell(info.getValue()),
        sortingFn: (a, b) =>
          (a.original.haki_armament ? 1 : 0) -
          (b.original.haki_armament ? 1 : 0),
        filterFn: booleanFilter as never,
        meta: { filterType: 'boolean' } as ColumnFilterMeta,
      }),
      columnHelper.accessor('haki_conqueror', {
        header: 'Conqueror',
        cell: (info) => renderHakiCell(info.getValue()),
        sortingFn: (a, b) =>
          (a.original.haki_conqueror ? 1 : 0) -
          (b.original.haki_conqueror ? 1 : 0),
        filterFn: booleanFilter as never,
        meta: { filterType: 'boolean' } as ColumnFilterMeta,
      }),
    ],
    [arcMap, isFiltered, totalChapters, totalVolumes]
  )

  // Create table instance
  const table = useReactTable({
    data: characters,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      columnFilters,
      columnVisibility,
    },
    onSortingChange,
    onGlobalFilterChange,
    onPaginationChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = row.getValue('name') as string
      return name?.toLowerCase().includes(filterValue.toLowerCase()) || false
    },
  })

  const renderFilterPopover = (header: {
    column: Column<Character, unknown>
  }) => {
    const meta = header.column.columnDef.meta as ColumnFilterMeta | undefined
    if (!meta?.filterType) return null

    return (
      <FilterPopover column={header.column}>
        {meta.filterType === 'range' ? (
          <RangeFilterContent
            value={
              (header.column.getFilterValue() as [
                number | undefined,
                number | undefined,
              ]) ?? [undefined, undefined]
            }
            onChange={(val) => {
              header.column.setFilterValue(
                val[0] === undefined && val[1] === undefined ? undefined : val
              )
              onPaginationChange((p) => ({ ...p, pageIndex: 0 }))
            }}
          />
        ) : meta.filterType === 'boolean' ? (
          <MultiSelectFilterContent
            options={['Yes', 'No']}
            selected={(header.column.getFilterValue() as string[]) ?? []}
            onChange={(val) => {
              header.column.setFilterValue(val.length === 0 ? undefined : val)
              onPaginationChange((p) => ({ ...p, pageIndex: 0 }))
            }}
          />
        ) : (
          <MultiSelectFilterContent
            options={
              uniqueValues[header.column.id as keyof typeof uniqueValues] ?? []
            }
            selected={(header.column.getFilterValue() as string[]) ?? []}
            onChange={(val) => {
              header.column.setFilterValue(val.length === 0 ? undefined : val)
              onPaginationChange((p) => ({ ...p, pageIndex: 0 }))
            }}
          />
        )}
      </FilterPopover>
    )
  }

  const hiddenCount = table
    .getAllLeafColumns()
    .filter((c) => !c.getIsVisible()).length

  const getColumnLabel = (col: Column<Character, unknown>) => {
    const metaLabel = (col.columnDef.meta as ColumnFilterMeta | undefined)
      ?.label
    if (metaLabel) return metaLabel
    if (typeof col.columnDef.header === 'string') return col.columnDef.header
    return col.id
  }

  const isDefaultVisibility =
    JSON.stringify(columnVisibility) ===
    JSON.stringify(DEFAULT_COLUMN_VISIBILITY)

  return (
    <div className="overflow-x-auto">
      {/* Toolbar */}
      <div className="px-4 py-2 flex items-center justify-end gap-2 border-b border-gray-100">
        <div ref={columnsMenuRef} className="relative">
          <button
            onClick={() => setColumnsMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Columns
            {hiddenCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                {hiddenCount} hidden
              </span>
            )}
          </button>
          {columnsMenuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-3 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Show columns
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      table
                        .getAllLeafColumns()
                        .forEach((c) => c.toggleVisibility(true))
                    }
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Show all
                  </button>
                  <button
                    onClick={() =>
                      table
                        .getAllLeafColumns()
                        .forEach((c) => c.toggleVisibility(c.id === 'name'))
                    }
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Hide all
                  </button>
                  <button
                    onClick={() =>
                      setColumnVisibility(DEFAULT_COLUMN_VISIBILITY)
                    }
                    disabled={isDefaultVisibility}
                    className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="space-y-0.5 max-h-64 overflow-auto">
                {table.getAllLeafColumns().map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {getColumnLabel(col)}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {columnFilters.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-blue-600">
            Active filters:
          </span>
          {columnFilters.map((f) => {
            const col = table.getColumn(f.id)
            const headerText = col ? getColumnLabel(col) : f.id
            return (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                {headerText}
                <button
                  onClick={() => col?.setFilterValue(undefined)}
                  className="hover:text-blue-900"
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
            )
          })}
          <button
            onClick={() => setColumnFilters([])}
            className="text-xs text-blue-600 hover:text-blue-800 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      <table className="min-w-full">
        <thead className="bg-gray-50 sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1.5">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() ? (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {header.column.getIsSorted() === 'asc' ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        )}
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
                      </svg>
                    )}
                    {renderFilterPopover(header)}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-gray-500"
              >
                No characters found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={`cursor-pointer transition-colors ${
                  index % 2 === 0
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-gray-50/50 hover:bg-gray-100/50'
                }`}
                onClick={() => navigate(`/characters/${row.original.id}`)}
                title="Click to view details"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600 text-center sm:text-left">
          Showing{' '}
          <span className="font-medium">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
          </span>{' '}
          to{' '}
          <span className="font-medium">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </span>{' '}
          of{' '}
          <span className="font-medium">
            {table.getFilteredRowModel().rows.length}
          </span>{' '}
          characters
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="First page"
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
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm text-gray-700 px-3 py-1 bg-white border border-gray-300 rounded-lg min-w-[120px] text-center">
            Page{' '}
            <span className="font-medium">
              {table.getState().pagination.pageIndex + 1}
            </span>{' '}
            of <span className="font-medium">{table.getPageCount()}</span>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next page"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Last page"
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CharacterTable
