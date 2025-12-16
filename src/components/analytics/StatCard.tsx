import { Link } from 'react-router-dom'
import React, { useState } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string // Optional subtitle displayed below the value
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'pink' | 'emerald'
  loading?: boolean
  link?: string
  className?: string
  tooltip?: string
  details?: string[] // Optional list of detail items that can be expanded/collapsed
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    iconBg: 'bg-blue-100',
    text: 'text-blue-900',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    iconBg: 'bg-green-100',
    text: 'text-green-900',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    iconBg: 'bg-purple-100',
    text: 'text-purple-900',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
    text: 'text-amber-900',
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: 'text-pink-600',
    iconBg: 'bg-pink-100',
    text: 'text-pink-900',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    text: 'text-emerald-900',
  },
}

/**
 * StatCard - Display key metrics with optional trends and color themes
 * Enhanced version with trend indicators and themed styling
 */
function StatCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'blue',
  loading = false,
  link,
  className = '',
  tooltip,
  details,
}: StatCardProps) {
  const styles = colorStyles[color]
  const [showTooltip, setShowTooltip] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const content = (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {/* Icon */}
        {icon && (
          <div className={`inline-flex items-center justify-center w-10 h-10 ${styles.iconBg} ${styles.icon} rounded-lg mb-3`}>
            {icon}
          </div>
        )}

        {/* Value */}
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
        ) : (
          <>
            <div className={`text-3xl font-bold ${styles.text} mb-1`}>
              {value}
            </div>
            {/* Subtitle */}
            {subtitle && (
              <div className="text-xs text-gray-500 mb-1">
                {subtitle}
              </div>
            )}
          </>
        )}

        {/* Label with info icon */}
        <div className="flex items-center gap-1">
          <div className="text-sm font-medium text-gray-600">{label}</div>
          {tooltip && (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Trend */}
        {trend && trendValue && !loading && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            {trend === 'neutral' && (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              </svg>
            )}
            <span
              className={`text-xs font-medium ${trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
            >
              {trendValue}
            </span>
          </div>
        )}

        {/* Expandable Details */}
        {details && details.length > 0 && !loading && (
          <div className="mt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {isExpanded ? 'Hide details' : 'Show details'}
            </button>
            {isExpanded && (
              <div className="mt-2 pl-4 space-y-1 text-xs text-gray-600 max-h-48 overflow-y-auto border-l-2 border-gray-200">
                {details.map((detail, index) => (
                  <div key={index} className="py-0.5">
                    {detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const cardClasses = `
    ${styles.bg} ${styles.border}
    border rounded-xl p-6
    transition-all duration-200
    ${className}
    relative
  `

  if (link && !loading) {
    return (
      <Link
        to={link}
        className={`${cardClasses} hover:shadow-md hover:border-opacity-80 block group`}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {content}
        {tooltip && showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-pre-wrap max-w-md z-50">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
        <div className="mt-3 flex items-center text-xs font-medium text-gray-600 group-hover:text-gray-900">
          View details
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    )
  }

  return (
    <div
      className={cardClasses}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {content}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-pre-wrap max-w-md z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatCard
