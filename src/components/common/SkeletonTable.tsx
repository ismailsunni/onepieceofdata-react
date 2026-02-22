interface SkeletonTableProps {
  rows?: number
  cols?: number
}

function SkeletonTable({ rows = 8, cols = 5 }: SkeletonTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="grid border-b border-gray-200 bg-gray-50 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-3/4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid px-4 py-3 border-b border-gray-100 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div key={colIdx} className="h-4 bg-gray-100 rounded" style={{ width: colIdx === 0 ? '60%' : '50%' }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default SkeletonTable
