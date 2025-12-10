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
import { Volume } from '../types/volume'

interface VolumeTableProps {
  volumes: Volume[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  globalFilter: string
  onGlobalFilterChange: (filter: string) => void
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

const columnHelper = createColumnHelper<Volume>()

function VolumeTable({
  volumes,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  pagination,
  onPaginationChange,
}: VolumeTableProps) {
  const navigate = useNavigate()

  // Define table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('number', {
        header: 'Volume',
        cell: (info) => (
          <span className="font-medium text-orange-600">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('chapter_range', {
        header: 'Chapter Range',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('chapter_count', {
        header: 'Chapters',
        cell: (info) => info.getValue() || 0,
      }),
      columnHelper.accessor('total_pages', {
        header: 'Total Pages',
        cell: (info) => info.getValue() || '-',
      }),
    ],
    []
  )

  // Create table instance
  const table = useReactTable({
    data: volumes,
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
      const title = row.getValue('title') as string
      const volumeNumber = row.getValue('number') as number
      return (
        title?.toLowerCase().includes(filterValue.toLowerCase()) ||
        volumeNumber?.toString().includes(filterValue) ||
        false
      )
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
                No volumes found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/volumes/${row.original.number}`)}
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
          of {table.getFilteredRowModel().rows.length} volumes
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

export default VolumeTable
