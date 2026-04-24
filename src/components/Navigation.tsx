import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import DesktopDropdown from './navigation/DesktopDropdown'
import MobileAccordion from './navigation/MobileAccordion'
import type { NavItem } from './navigation/DesktopDropdown'
import { useAuth } from '../contexts/AuthContext'

const EXPLORE_ITEMS: NavItem[] = [
  { to: '/characters', label: 'Characters' },
  { to: '/sagas', label: 'Sagas' },
  { to: '/arcs', label: 'Arcs' },
  { to: '/volumes', label: 'Volumes' },
  { to: '/chapters', label: 'Chapters' },
  { to: '/affiliations', label: 'Affiliations' },
  { to: '/occupations', label: 'Occupations' },
  { to: '/devil-fruits', label: 'Devil Fruits' },
]

const GAMES_ITEMS: NavItem[] = [
  { to: '/games', label: 'All Games', exact: true },
  { to: '/games/guess-character', label: 'Guess the Character' },
  { to: '/games/who-am-i', label: 'Who Am I?' },
]

const ANALYTICS_ITEMS: NavItem[] = [
  { to: '/analytics', label: 'Dashboard', exact: true },
  { label: 'Topics', heading: true },
  { to: '/analytics/bounty', label: 'Bounty & Power', exact: true },
  {
    to: '/analytics/appearances',
    label: 'Appearances & Longevity',
    exact: true,
  },
  { to: '/analytics/story', label: 'Story & Publication', exact: true },
  { to: '/analytics/demographics', label: 'Demographics', exact: true },
  { to: '/analytics/characters', label: 'Character Rankings', exact: true },
  { to: '/analytics/affiliations', label: 'Affiliations', exact: true },
  { to: '/analytics/data-quality', label: 'Data Quality', exact: true },
  { label: 'Interactive Tools', heading: true },
  {
    to: '/analytics/character-compare',
    label: 'Character Comparison',
    exact: true,
  },
  { to: '/analytics/network', label: 'Character Network', exact: true },
  {
    to: '/analytics/character-timeline',
    label: 'Character Timeline',
    exact: true,
  },
  { to: '/analytics/word-cloud', label: 'Character Word Cloud', exact: true },
  {
    to: '/analytics/appearance-race',
    label: 'Appearance Race',
    exact: true,
  },
  {
    to: '/analytics/release-predictor',
    label: 'Release Predictor',
    exact: true,
  },
  { to: '/analytics/chapter-releases', label: 'Release History', exact: true },
]

const getLinkClass = ({ isActive }: { isActive: boolean }) => {
  const base = 'px-3 py-2 rounded-md transition-colors text-sm font-medium'
  return `${base} ${isActive ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
}

const getMobileLinkClass = ({ isActive }: { isActive: boolean }) => {
  const base = 'block px-4 py-3 rounded-lg transition-colors text-base'
  return `${base} ${isActive ? 'text-gray-900 bg-gray-100 font-semibold' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium'}`
}

function Navigation() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [exploreExpanded, setExploreExpanded] = useState(false)
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false)
  const [gamesExpanded, setGamesExpanded] = useState(false)

  const isExploreActive =
    location.pathname.startsWith('/characters') ||
    location.pathname.startsWith('/arcs') ||
    location.pathname.startsWith('/sagas') ||
    location.pathname.startsWith('/chapters') ||
    location.pathname.startsWith('/volumes') ||
    location.pathname.startsWith('/affiliations') ||
    location.pathname.startsWith('/occupations') ||
    location.pathname.startsWith('/devil-fruits')
  const isAnalyticsActive = location.pathname.startsWith('/analytics')
  const isGamesActive = location.pathname.startsWith('/games')

  const closeMobileMenu = () => setMobileMenuOpen(false)
  const { user, signOut } = useAuth()

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1">
        <NavLink to="/" className={getLinkClass}>
          Home
        </NavLink>

        <DesktopDropdown
          label="Explore"
          isActive={isExploreActive}
          items={EXPLORE_ITEMS}
        />
        <DesktopDropdown
          label="Analytics"
          isActive={isAnalyticsActive}
          items={ANALYTICS_ITEMS}
          width="w-64"
        />

        <DesktopDropdown
          label="Games"
          isActive={isGamesActive}
          items={GAMES_ITEMS}
          width="w-56"
        />

        <NavLink to="/about" className={getLinkClass}>
          About
        </NavLink>

        <NavLink to="/chat" className={getLinkClass}>
          <span className="inline-flex items-center gap-1">✨ AI Chat</span>
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
              <MobileAccordion
                label="Explore"
                expanded={exploreExpanded}
                onToggle={() => setExploreExpanded((v) => !v)}
                items={EXPLORE_ITEMS}
                onClose={closeMobileMenu}
              />
              <MobileAccordion
                label="Analytics"
                expanded={analyticsExpanded}
                onToggle={() => setAnalyticsExpanded((v) => !v)}
                items={ANALYTICS_ITEMS}
                onClose={closeMobileMenu}
              />

              <MobileAccordion
                label="Games"
                expanded={gamesExpanded}
                onToggle={() => setGamesExpanded((v) => !v)}
                items={GAMES_ITEMS}
                onClose={closeMobileMenu}
              />

              <NavLink
                to="/about"
                className={getMobileLinkClass}
                onClick={closeMobileMenu}
              >
                About
              </NavLink>

              <NavLink
                to="/chat"
                className={getMobileLinkClass}
                onClick={closeMobileMenu}
              >
                ✨ AI Chat
              </NavLink>

              {user ? (
                <button
                  onClick={() => {
                    signOut()
                    closeMobileMenu()
                  }}
                  className="block w-full text-left px-4 py-3 rounded-lg text-base text-gray-700 hover:bg-gray-50 font-medium transition-colors mt-2 border-t border-gray-100"
                >
                  Sign out
                </button>
              ) : null}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

export default Navigation
