function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  )
}

export default SkeletonCard
