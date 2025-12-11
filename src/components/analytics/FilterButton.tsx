import React from 'react'

interface FilterButtonProps {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  count?: number
  disabled?: boolean
  className?: string
}

const variantStyles = {
  default: {
    active: 'bg-blue-600 text-white border-blue-600',
    inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400',
  },
  primary: {
    active: 'bg-blue-600 text-white border-blue-600',
    inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300',
  },
  success: {
    active: 'bg-green-600 text-white border-green-600',
    inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300',
  },
  warning: {
    active: 'bg-amber-600 text-white border-amber-600',
    inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-amber-50 hover:border-amber-300',
  },
}

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-sm',
}

/**
 * FilterButton - Standardized button for filtering data in analytics
 * Supports active/inactive states, variants, and optional counts
 */
function FilterButton({
  active = false,
  onClick,
  children,
  variant = 'default',
  size = 'md',
  icon,
  count,
  disabled = false,
  className = '',
}: FilterButtonProps) {
  const variantStyle = variantStyles[variant]
  const style = active ? variantStyle.active : variantStyle.inactive
  const sizeStyle = sizeStyles[size]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${style}
        ${sizeStyle}
        inline-flex items-center gap-2
        border rounded-lg
        font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={`
            inline-flex items-center justify-center
            min-w-[20px] h-5 px-1.5
            text-xs font-semibold rounded-full
            ${active ? 'bg-white bg-opacity-20' : 'bg-gray-200 text-gray-700'}
          `}
        >
          {count}
        </span>
      )}
    </button>
  )
}

export default FilterButton
