import { useState, useMemo, ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number | null
}

interface SortableTableProps<T> {
  columns: Column<T>[]
  data: T[]
  defaultSortField?: string
  defaultSortDirection?: 'asc' | 'desc'
  maxHeight?: string
  rowKey: (row: T) => string | number
  pageSize?: number
  /** Called when a row is clicked. Adds clickable hover + cursor styling. */
  onRowClick?: (row: T) => void
  /** Returns true if the row should render in a selected style. */
  isRowSelected?: (row: T) => boolean
}

export default function SortableTable<T>({
  columns,
  data,
  defaultSortField,
  defaultSortDirection = 'asc',
  maxHeight,
  rowKey,
  pageSize,
  onRowClick,
  isRowSelected,
}: SortableTableProps<T>) {
  const [sortField, setSortField] = useState(defaultSortField ?? '')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSortDirection
  )
  const [pageIndex, setPageIndex] = useState(0)

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(key)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortField) return data
    const col = columns.find((c) => c.key === sortField)
    if (!col?.sortValue) return data
    const getValue = col.sortValue
    return [...data].sort((a, b) => {
      const aVal = getValue(a)
      const bVal = getValue(b)
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [data, sortField, sortDirection, columns])

  const totalRows = sortedData.length
  const pageCount = pageSize ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1

  // Clamp during render so the page resets when data shrinks
  const safePageIndex = Math.min(Math.max(0, pageIndex), pageCount - 1)

  const pagedData = useMemo(() => {
    if (!pageSize) return sortedData
    const start = safePageIndex * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, safePageIndex, pageSize])

  const indicator = (key: string) => {
    if (sortField !== key)
      return (
        <span aria-hidden="true" className="text-gray-400 ml-1">
          ↕
        </span>
      )
    return (
      <span aria-hidden="true" className="ml-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    )
  }

  const ariaSortFor = (key: string): 'ascending' | 'descending' | 'none' =>
    sortField === key
      ? sortDirection === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none'

  const useScroll = maxHeight && pagedData.length > 20

  const startRow = totalRows === 0 ? 0 : safePageIndex * (pageSize ?? 0) + 1
  const endRow = pageSize
    ? Math.min((safePageIndex + 1) * pageSize, totalRows)
    : totalRows

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <div style={useScroll ? { maxHeight, overflowY: 'auto' } : undefined}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => {
                const sortable = col.sortable !== false
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={sortable ? ariaSortFor(col.key) : undefined}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center font-semibold uppercase tracking-wider text-gray-700 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      >
                        {col.label}
                        {indicator(col.key)}
                      </button>
                    ) : (
                      <span className="inline-flex items-center">
                        {col.label}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-gray-600"
                >
                  No results.
                </td>
              </tr>
            ) : (
              pagedData.map((row) => {
                const selected = isRowSelected?.(row) ?? false
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-gray-100 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${
                      selected
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-gray-700 align-top"
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pageSize && totalRows > 0 && (
        <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{startRow}</span> to{' '}
            <span className="font-medium">{endRow}</span> of{' '}
            <span className="font-medium">{totalRows}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageIndex(0)}
              disabled={safePageIndex === 0}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="First page"
              aria-label="First page"
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
              onClick={() => setPageIndex(Math.max(0, safePageIndex - 1))}
              disabled={safePageIndex === 0}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Previous page"
              aria-label="Previous page"
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
            <span className="text-sm text-gray-700 px-3 py-1 bg-white border border-gray-300 rounded-lg min-w-[110px] text-center">
              Page <span className="font-medium">{safePageIndex + 1}</span> of{' '}
              <span className="font-medium">{pageCount}</span>
            </span>
            <button
              onClick={() =>
                setPageIndex(Math.min(pageCount - 1, safePageIndex + 1))
              }
              disabled={safePageIndex >= pageCount - 1}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Next page"
              aria-label="Next page"
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
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={safePageIndex >= pageCount - 1}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Last page"
              aria-label="Last page"
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
      )}
    </div>
  )
}
