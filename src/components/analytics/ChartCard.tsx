import React from 'react'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  onExport?: () => void
  filters?: React.ReactNode
  className?: string
  actions?: React.ReactNode
  loading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  isExporting?: boolean
}

/**
 * ChartCard - Consistent wrapper for all analytics charts
 * Provides title, description, export functionality, and filters
 */
function ChartCard({
  title,
  description,
  children,
  onExport,
  filters,
  className = '',
  actions,
  loading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
  isExporting = false,
}: ChartCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}
    >
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>

          {/* Actions (Export, etc.) */}
          {(onExport || actions) && (
            <div className="flex items-center gap-2 ml-4">
              {actions}
              {onExport && (
                <button
                  onClick={onExport}
                  disabled={isExporting}
                  className={`p-2 rounded-lg transition-colors ${isExporting
                      ? 'text-gray-400 bg-gray-50 cursor-wait'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  title="Export chart"
                >
                  {isExporting ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        {filters && (
          <div className="mt-3 pt-3 border-t border-gray-200">{filters}</div>
        )}
      </div>

      {/* Chart Content */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {isEmpty && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export default ChartCard
