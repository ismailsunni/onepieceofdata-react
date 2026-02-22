import React from 'react'

interface EmptyStateProps {
  title?: string
  message?: string
  action?: React.ReactNode
}

function EmptyState({
  title = 'No results found',
  message = 'Try adjusting your filters or search query.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 text-gray-400 rounded-full mb-4">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 max-w-sm mb-6">{message}</p>
      {action && <div>{action}</div>}
    </div>
  )
}

export default EmptyState
