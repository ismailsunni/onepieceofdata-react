import { NavLink, useLocation } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

export interface NavItem {
  to: string
  label: string
  exact?: boolean // if true, match only exact path (default: startsWith)
}

interface DesktopDropdownProps {
  label: string
  isActive: boolean
  items: NavItem[]
  width?: string // tailwind width class e.g. 'w-48' or 'w-56'
}

const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

export default function DesktopDropdown({
  label,
  isActive,
  items,
  width = 'w-48',
}: DesktopDropdownProps) {
  const location = useLocation()

  const buttonClass = [
    'px-3 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-1 cursor-pointer',
    isActive
      ? 'text-gray-900 bg-gray-100'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
  ].join(' ')

  const getItemClass = (focus: boolean, to: string, exact?: boolean) => {
    const itemActive = exact
      ? location.pathname === to
      : location.pathname.startsWith(to)
    return [
      'block px-4 py-2 text-sm text-gray-700',
      focus ? 'bg-gray-50' : '',
      itemActive ? 'bg-gray-100 font-medium' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton className={buttonClass}>
        {label}
        <ChevronDown />
      </MenuButton>
      <MenuItems
        className={`absolute left-0 mt-2 ${width} origin-top-left rounded-lg bg-white shadow-lg border border-gray-200 focus:outline-none z-10`}
      >
        <div className="py-1">
          {items.map((item) => (
            <MenuItem key={item.to}>
              {({ focus }) => (
                <NavLink
                  to={item.to}
                  className={getItemClass(focus, item.to, item.exact)}
                >
                  {item.label}
                </NavLink>
              )}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  )
}
