import { NavLink, useLocation } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

function Navigation() {
  const location = useLocation()

  // This function returns the CSS classes for nav links
  // isActive comes from React Router and tells us if this link matches the current page
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = 'px-3 py-2 rounded-md transition-colors text-sm font-medium'
    const activeClass = 'text-gray-900 bg-gray-100'
    const inactiveClass = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'

    return `${baseClass} ${isActive ? activeClass : inactiveClass}`
  }

  // Check if any route in a group is active
  const isStoryActive = location.pathname.startsWith('/arcs') || location.pathname.startsWith('/sagas')
  const isMediaActive = location.pathname.startsWith('/chapters') || location.pathname.startsWith('/volumes')
  const isAnalyticsActive = location.pathname.startsWith('/analytics')

  // Menu button class based on active state
  const getMenuButtonClass = (isActive: boolean) => {
    const baseClass = 'px-3 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-1 cursor-pointer'
    const activeClass = 'text-gray-900 bg-gray-100'
    const inactiveClass = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'

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
        <MenuItems className="absolute left-0 mt-2 w-48 origin-top-left rounded-lg bg-white shadow-lg border border-gray-200 focus:outline-none z-10">
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/sagas"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname.startsWith('/sagas') ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Sagas
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/arcs"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname.startsWith('/arcs') ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Arcs
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
        <MenuItems className="absolute left-0 mt-2 w-48 origin-top-left rounded-lg bg-white shadow-lg border border-gray-200 focus:outline-none z-10">
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/volumes"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname.startsWith('/volumes') ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Volumes
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/chapters"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname.startsWith('/chapters') ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Chapters
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
        <MenuItems className="absolute left-0 mt-2 w-56 origin-top-left rounded-lg bg-white shadow-lg border border-gray-200 focus:outline-none z-10">
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/analytics"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname === '/analytics' ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Dashboard
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/analytics/character-stats"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname === '/analytics/character-stats' ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Character Stats
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/analytics/character-appearances"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname === '/analytics/character-appearances' ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Character Appearances
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/analytics/story-arcs"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname === '/analytics/story-arcs' ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Story & Arcs
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/analytics/birthdays"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname === '/analytics/birthdays' ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Birthdays
                </NavLink>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <NavLink
                  to="/analytics/chapter-releases"
                  className={`${
                    focus ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700 ${
                    location.pathname === '/analytics/chapter-releases' ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  Chapter Releases
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
