import { useMemo } from 'react'
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
} from '@tanstack/react-table'
import { Character } from '../types/character'
import { Arc } from '../types/arc'

interface CharacterTableProps {
  characters: Character[]
  arcs: Arc[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  globalFilter: string
  onGlobalFilterChange: (filter: string) => void
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

const columnHelper = createColumnHelper<Character>()

function CharacterTable({
  characters,
  arcs,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  pagination,
  onPaginationChange,
}: CharacterTableProps) {
  const navigate = useNavigate()

  // Create arc lookup map
  const arcMap = useMemo(() => {
    const map = new Map<string, string>()
    arcs.forEach((arc) => {
      map.set(arc.arc_id, arc.title)
    })
    return map
  }, [arcs])

  // Define table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const name = info.getValue()
          if (!name) return '-'

          return (
            <span className="font-medium text-blue-600">
              {name}
            </span>
          )
        },
      }),
      columnHelper.accessor('origin', {
        header: 'Origin',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                status === 'Alive'
                  ? 'bg-green-100 text-green-800'
                  : status === 'Deceased'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {status || 'Unknown'}
            </span>
          )
        },
      }),
      columnHelper.accessor('appearance_count', {
        header: 'Num Appearance',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('first_appearance', {
        header: 'First Appearance',
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
                <span className="text-xs text-gray-500 mt-0.5">
                  {arcName}
                </span>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('bounty', {
        header: 'Bounty',
        cell: (info) => {
          const bounty = info.getValue()
          return bounty ? `฿${bounty.toLocaleString()}` : '-'
        },
      }),
      columnHelper.accessor('age', {
        header: 'Age',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('blood_type', {
        header: 'Blood Type',
        cell: (info) => info.getValue() || '-',
      }),
    ],
    [arcMap]
  )

  // Create table instance
  const table = useReactTable({
    data: characters,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange,
    onGlobalFilterChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = row.getValue('name') as string
      return name?.toLowerCase().includes(filterValue.toLowerCase()) || false
    },
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() ? (
                      <span>
                        {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                      </span>
                    ) : (
                      <span className="text-gray-300">↕</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-gray-500"
              >
                No characters found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/characters/${row.original.id}`)}
                title="Click to view details"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-white">
        <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} characters
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-2 sm:px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {'<<'}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 sm:px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {'<'}
          </button>
          <span className="text-xs sm:text-sm text-gray-700 px-2">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 sm:px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {'>'}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-2 sm:px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {'>>'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CharacterTable
