import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import DesktopDropdown from './navigation/DesktopDropdown'
import MobileAccordion from './navigation/MobileAccordion'
import type { NavItem } from './navigation/DesktopDropdown'
import { useAuth } from '../contexts/AuthContext'

const STORY_ITEMS: NavItem[] = [
  { to: '/sagas', label: 'Sagas' },
  { to: '/arcs', label: 'Arcs' },
]

const MEDIA_ITEMS: NavItem[] = [
  { to: '/volumes', label: 'Volumes' },
  { to: '/chapters', label: 'Chapters' },
]

const ANALYTICS_ITEMS: NavItem[] = [
  { to: '/analytics', label: 'Dashboard', exact: true },
  { to: '/analytics/character-stats', label: 'Character Stats', exact: true },
  {
    to: '/analytics/character-appearances',
    label: 'Character Appearances',
    exact: true,
  },
  {
    to: '/analytics/character-completeness',
    label: 'Data Completeness',
    exact: true,
  },
  { to: '/analytics/story-arcs', label: 'Story & Arcs', exact: true },
  { to: '/analytics/birthdays', label: 'Birthdays', exact: true },
  { to: '/analytics/chapter-releases', label: 'Chapter Releases', exact: true },
  { to: '/analytics/publication-rate', label: 'Publication Rate', exact: true },
  { to: '/analytics/network', label: 'Character Network', exact: true },
]

const getLinkClass = ({ isActive }: { isActive: boolean }) => {
  const base = 'px-2 py-1.5 rounded-md transition-colors text-xs font-medium whitespace-nowrap'
  return `${base} ${isActive ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
}

const getMobileLinkClass = ({ isActive }: { isActive: boolean }) => {
  const base = 'block px-4 py-3 rounded-lg transition-colors text-base'
  return `${base} ${isActive ? 'text-gray-900 bg-gray-100 font-semibold' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium'}`
}

function Navigation() {
  const location = useLocation()
  const { user, signIn, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [storyExpanded, setStoryExpanded] = useState(false)
  const [mediaExpanded, setMediaExpanded] = useState(false)
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false)

  const isStoryActive =
    location.pathname.startsWith('/arcs') ||
    location.pathname.startsWith('/sagas')
  const isMediaActive =
    location.pathname.startsWith('/chapters') ||
    location.pathname.startsWith('/volumes')
  const isAnalyticsActive = location.pathname.startsWith('/analytics')

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1">
        <NavLink to="/" className={getLinkClass}>
          Home
        </NavLink>
        <NavLink to="/characters" className={getLinkClass}>
          Characters
        </NavLink>

        <DesktopDropdown
          label="Story"
          isActive={isStoryActive}
          items={STORY_ITEMS}
        />
        <DesktopDropdown
          label="Media"
          isActive={isMediaActive}
          items={MEDIA_ITEMS}
        />
        <DesktopDropdown
          label="Analytics"
          isActive={isAnalyticsActive}
          items={ANALYTICS_ITEMS}
          width="w-56"
        />

        <NavLink to="/chat" className={getLinkClass}>
          <span className="inline-flex items-center gap-1">✨ AI Chat</span>
        </NavLink>

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
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="fixed inset-0 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <nav className="p-4 space-y-1 overflow-y-auto max-h-full">
              <NavLink
                to="/"
                className={getMobileLinkClass}
                onClick={closeMobileMenu}
              >
                Home
              </NavLink>
              <NavLink
                to="/characters"
                className={getMobileLinkClass}
                onClick={closeMobileMenu}
              >
                Characters
              </NavLink>

              <MobileAccordion
                label="Story"
                expanded={storyExpanded}
                onToggle={() => setStoryExpanded((v) => !v)}
                items={STORY_ITEMS}
                onClose={closeMobileMenu}
              />
              <MobileAccordion
                label="Media"
                expanded={mediaExpanded}
                onToggle={() => setMediaExpanded((v) => !v)}
                items={MEDIA_ITEMS}
                onClose={closeMobileMenu}
              />
              <MobileAccordion
                label="Analytics"
                expanded={analyticsExpanded}
                onToggle={() => setAnalyticsExpanded((v) => !v)}
                items={ANALYTICS_ITEMS}
                onClose={closeMobileMenu}
              />

              <NavLink
                to="/chat"
                className={getMobileLinkClass}
                onClick={closeMobileMenu}
              >
                ✨ AI Chat
              </NavLink>

              <NavLink
                to="/about"
                className={getMobileLinkClass}
                onClick={closeMobileMenu}
              >
                About
              </NavLink>

              {/* Mobile Auth */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                {user ? (
                  <button
                    onClick={() => {
                      signOut()
                      closeMobileMenu()
                    }}
                    className="block w-full text-left px-4 py-3 rounded-lg text-base text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      signIn()
                      closeMobileMenu()
                    }}
                    className="block w-full text-left px-4 py-3 rounded-lg text-base text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

export default Navigation
