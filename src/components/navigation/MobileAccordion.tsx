import { NavLink } from 'react-router-dom'
import type { NavItem } from './DesktopDropdown'

interface MobileAccordionProps {
  label: string
  expanded: boolean
  onToggle: () => void
  items: NavItem[]
  onClose: () => void
}

const subLinkClass = ({ isActive }: { isActive: boolean }) => {
  const base = 'block pl-8 pr-4 py-2.5 rounded-lg transition-colors text-sm'
  const active = 'text-gray-900 bg-gray-100 font-medium'
  const inactive = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
  return `${base} ${isActive ? active : inactive}`
}

export default function MobileAccordion({
  label,
  expanded,
  onToggle,
  items,
  onClose,
}: MobileAccordionProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
      >
        <span>{label}</span>
        <svg
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {expanded && (
        <div className="space-y-1 mt-1">
          {items.map((item, idx) =>
            item.heading ? (
              <div
                key={`heading-${idx}`}
                className="pl-8 pr-4 pt-2 pb-0.5 text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                {item.label}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to!}
                className={subLinkClass}
                onClick={onClose}
                end={item.exact}
              >
                <span className="flex items-center justify-between gap-2">
                  {item.label}
                  {item.badge && (
                    <span className="text-xs text-orange-500 font-medium">
                      {item.badge}
                    </span>
                  )}
                </span>
              </NavLink>
            )
          )}
        </div>
      )}
    </div>
  )
}
