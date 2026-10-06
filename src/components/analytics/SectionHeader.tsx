import React from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  as?: 'h1' | 'h2'
}

/**
 * SectionHeader - Consistent section title component for analytics pages
 * Provides title, optional icon, description, and action buttons
 */
function SectionHeader({
  title,
  description,
  icon,
  actions,
  className = '',
  as: Heading = 'h2',
}: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg text-gray-600">
                {icon}
              </div>
            )}
            <Heading className="text-2xl font-bold text-gray-900">
              {title}
            </Heading>
          </div>
          {description && <p className="text-gray-600 mt-1">{description}</p>}
        </div>
        {actions && <div className="ml-4">{actions}</div>}
      </div>
    </div>
  )
}

export default SectionHeader
