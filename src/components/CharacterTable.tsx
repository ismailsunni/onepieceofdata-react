import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  OnChangeFn,
} from '@tanstack/react-table'
import { Character } from '../types/character'

interface CharacterTableProps {
  characters: Character[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  globalFilter: string
  onGlobalFilterChange: (filter: string) => void
}

const columnHelper = createColumnHelper<Character>()

function CharacterTable({
  characters,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
}: CharacterTableProps) {
  // Define table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue() || '-',
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
    []
  )

  // Create table instance
  const table = useReactTable({
    data: characters,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
              <tr key={row.id} className="hover:bg-gray-50">
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
      <div className="px-6 py-4 text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} of {characters.length}{' '}
        characters
      </div>
    </div>
  )
}

export default CharacterTable
