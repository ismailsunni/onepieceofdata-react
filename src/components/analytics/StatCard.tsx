import { Link } from 'react-router-dom'
import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'pink' | 'emerald'
  loading?: boolean
  link?: string
  className?: string
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
  icon,
  trend,
  trendValue,
  color = 'blue',
  loading = false,
  link,
  className = '',
}: StatCardProps) {
  const styles = colorStyles[color]

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
          <div className={`text-3xl font-bold ${styles.text} mb-1`}>
            {value}
          </div>
        )}

        {/* Label */}
        <div className="text-sm font-medium text-gray-600">{label}</div>

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
              className={`text-xs font-medium ${
                trend === 'up'
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
      </div>
    </div>
  )

  const cardClasses = `
    ${styles.bg} ${styles.border}
    border rounded-xl p-6
    transition-all duration-200
    ${className}
  `

  if (link && !loading) {
    return (
      <Link
        to={link}
        className={`${cardClasses} hover:shadow-md hover:border-opacity-80 block group`}
      >
        {content}
        <div className="mt-3 flex items-center text-xs font-medium text-gray-600 group-hover:text-gray-900">
          View details
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    )
  }

  return <div className={cardClasses}>{content}</div>
}

export default StatCard
