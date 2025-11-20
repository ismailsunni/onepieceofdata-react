import { NavLink, useLocation } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

function Navigation() {
  const location = useLocation()

  // This function returns the CSS classes for nav links
  // isActive comes from React Router and tells us if this link matches the current page
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = 'px-3 py-2 rounded-md transition-colors duration-200 text-sm md:text-base'
    const activeClass = 'bg-blue-700 text-white'
    const inactiveClass = 'text-blue-100 hover:bg-blue-700 hover:text-white'

    return `${baseClass} ${isActive ? activeClass : inactiveClass}`
  }

  // Check if any route in a group is active
  const isStoryActive = location.pathname.startsWith('/arcs') || location.pathname.startsWith('/sagas')
  const isMediaActive = location.pathname.startsWith('/chapters') || location.pathname.startsWith('/volumes')
  const isAnalyticsActive = location.pathname.startsWith('/analytics')

  // Menu button class based on active state
  const getMenuButtonClass = (isActive: boolean) => {
    const baseClass = 'px-3 py-2 rounded-md transition-colors duration-200 text-sm md:text-base flex items-center gap-1 cursor-pointer'
    const activeClass = 'bg-blue-700 text-white'
    const inactiveClass = 'text-blue-100 hover:bg-blue-700 hover:text-white'

    return `${baseClass} ${isActive ? activeClass : inactiveClass}`
  }

  return (
    <nav className="flex flex-wrap gap-2">
      <NavLink to="/" className={getLinkClass}>
        Home
      </NavLink>
      <NavLink to="/characters" className={getLinkClass}>
        Characters
      </NavLink>

      {/* Story Dropdown */}
      <Menu as="div" className="relative">
        <MenuButton className={getMenuButtonClass(isStoryActive)}>
          Story
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </MenuButton>
        <MenuItems className="absolute left-0 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/arcs"
                  className={`${
                    focus ? 'bg-blue-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname.startsWith('/arcs') ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  Arcs
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/sagas"
                  className={`${
                    focus ? 'bg-blue-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname.startsWith('/sagas') ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  Sagas
                </NavLink>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>

      {/* Media Dropdown */}
      <Menu as="div" className="relative">
        <MenuButton className={getMenuButtonClass(isMediaActive)}>
          Media
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </MenuButton>
        <MenuItems className="absolute left-0 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/chapters"
                  className={`${
                    focus ? 'bg-blue-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname.startsWith('/chapters') ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  Chapters
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/volumes"
                  className={`${
                    focus ? 'bg-blue-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname.startsWith('/volumes') ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  Volumes
                </NavLink>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>

      {/* Analytics Dropdown */}
      <Menu as="div" className="relative">
        <MenuButton className={getMenuButtonClass(isAnalyticsActive)}>
          Analytics
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </MenuButton>
        <MenuItems className="absolute left-0 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/analytics"
                  className={`${
                    focus ? 'bg-blue-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname === '/analytics' ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  Dashboard
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/analytics/character-timeline"
                  className={`${
                    focus ? 'bg-blue-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname === '/analytics/character-timeline' ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  Character Timeline
                </NavLink>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>

      <NavLink to="/about" className={getLinkClass}>
        About
      </NavLink>
    </nav>
  )
}

export default Navigation
