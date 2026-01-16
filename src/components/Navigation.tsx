import { NavLink, useLocation } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useState } from 'react'

function Navigation() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [storyExpanded, setStoryExpanded] = useState(false)
  const [mediaExpanded, setMediaExpanded] = useState(false)
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false)

  // This function returns the CSS classes for nav links
  // isActive comes from React Router and tells us if this link matches the current page
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = 'px-3 py-2 rounded-md transition-colors text-sm font-medium'
    const activeClass = 'text-gray-900 bg-gray-100'
    const inactiveClass = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'

    return `${baseClass} ${isActive ? activeClass : inactiveClass}`
  }

  const getMobileLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = 'block px-4 py-3 rounded-lg transition-colors text-base'
    const activeClass = 'text-gray-900 bg-gray-100 font-semibold'
    const inactiveClass = 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium'

    return `${baseClass} ${isActive ? activeClass : inactiveClass}`
  }

  const getMobileSubLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = 'block pl-8 pr-4 py-2.5 rounded-lg transition-colors text-sm'
    const activeClass = 'text-gray-900 bg-gray-100 font-medium'
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

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex flex-wrap gap-2">
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
                    to="/analytics/character-completeness"
                    className={`${
                      focus ? 'bg-gray-50' : ''
                    } block px-4 py-2 text-sm text-gray-700 ${
                      location.pathname === '/analytics/character-completeness' ? 'bg-gray-100 font-medium' : ''
                    }`}
                  >
                    Data Completeness
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
              <MenuItem>
                {({ focus }) => (
                  <NavLink
                    to="/analytics/publication-rate"
                    className={`${
                      focus ? 'bg-gray-50' : ''
                    } block px-4 py-2 text-sm text-gray-700 ${
                      location.pathname === '/analytics/publication-rate' ? 'bg-gray-100 font-medium' : ''
                    }`}
                  >
                    Publication Rate
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

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="fixed inset-0 bg-white">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Content */}
            <nav className="p-4 space-y-1 overflow-y-auto max-h-full">
              <NavLink to="/" className={getMobileLinkClass} onClick={closeMobileMenu}>
                Home
              </NavLink>
              <NavLink to="/characters" className={getMobileLinkClass} onClick={closeMobileMenu}>
                Characters
              </NavLink>

              {/* Story Section */}
              <div>
                <button
                  onClick={() => setStoryExpanded(!storyExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <span>Story</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${storyExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {storyExpanded && (
                  <div className="space-y-1 mt-1">
                    <NavLink to="/sagas" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Sagas
                    </NavLink>
                    <NavLink to="/arcs" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Arcs
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Media Section */}
              <div>
                <button
                  onClick={() => setMediaExpanded(!mediaExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <span>Media</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${mediaExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mediaExpanded && (
                  <div className="space-y-1 mt-1">
                    <NavLink to="/volumes" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Volumes
                    </NavLink>
                    <NavLink to="/chapters" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Chapters
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Analytics Section */}
              <div>
                <button
                  onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <span>Analytics</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${analyticsExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {analyticsExpanded && (
                  <div className="space-y-1 mt-1">
                    <NavLink to="/analytics" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Dashboard
                    </NavLink>
                    <NavLink to="/analytics/character-stats" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Character Stats
                    </NavLink>
                    <NavLink to="/analytics/character-appearances" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Character Appearances
                    </NavLink>
                    <NavLink to="/analytics/character-completeness" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Data Completeness
                    </NavLink>
                    <NavLink to="/analytics/story-arcs" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Story & Arcs
                    </NavLink>
                    <NavLink to="/analytics/birthdays" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Birthdays
                    </NavLink>
                    <NavLink to="/analytics/chapter-releases" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Chapter Releases
                    </NavLink>
                    <NavLink to="/analytics/publication-rate" className={getMobileSubLinkClass} onClick={closeMobileMenu}>
                      Publication Rate
                    </NavLink>
                  </div>
                )}
              </div>

              <NavLink to="/about" className={getMobileLinkClass} onClick={closeMobileMenu}>
                About
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

export default Navigation
