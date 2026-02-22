interface SkeletonChartProps {
  height?: string
  title?: boolean
}

function SkeletonChart({ height = 'h-64', title = true }: SkeletonChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
      {title && <div className="h-6 bg-gray-200 rounded w-48 mb-4" />}
      <div className={`${height} bg-gray-100 rounded-lg flex items-end gap-2 px-4 pb-4`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 rounded-t"
            style={{ height: `${30 + Math.sin(i) * 20 + 30}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export default SkeletonChart
