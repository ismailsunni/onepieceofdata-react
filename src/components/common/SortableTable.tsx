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
}

export default function SortableTable<T>({
  columns,
  data,
  defaultSortField,
  defaultSortDirection = 'asc',
  maxHeight,
  rowKey,
}: SortableTableProps<T>) {
  const [sortField, setSortField] = useState(defaultSortField ?? '')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection)

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

  const indicator = (key: string) => {
    if (sortField !== key) return <span className="text-gray-300 ml-1">▲</span>
    return <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
  }

  const useScroll = maxHeight && data.length > 20

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <div style={useScroll ? { maxHeight, overflowY: 'auto' } : undefined}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
                    col.sortable !== false ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                  }`}
                  onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.sortable !== false && indicator(col.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
