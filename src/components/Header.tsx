import { Link } from 'react-router-dom'
import { useState } from 'react'
import Navigation from './Navigation'
import Search from './Search'
import { useAuth } from '../contexts/AuthContext'

function Header() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const { user, signIn, signOut } = useAuth()
  // Auth UI is in the header (desktop) and Navigation (mobile)

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm shrink-0 z-50 relative">
      {/* Skip to main content link for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 font-semibold text-base leading-tight group-hover:text-blue-600 transition-colors">
                One Piece of Data
                <sup className="text-xs text-orange-500 ml-1">beta</sup>
              </span>
              <span className="text-gray-500 text-xs leading-tight hidden sm:block">
                Data exploration for One Piece
              </span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md">
            <Search />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4 relative z-[60]">
            {/* Mobile Search Button */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <Navigation />

            {/* Auth Section — desktop only */}
            <div className="hidden lg:flex items-center gap-3 border-l border-gray-200 pl-3">
              {user ? (
                <>
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'User'}
                      className="w-7 h-7 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={signIn}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {mobileSearchOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[70] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="bg-white h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Search</h2>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close search"
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

            {/* Search Content */}
            <div className="p-4 flex-1 overflow-y-auto">
              <Search onNavigate={() => setMobileSearchOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
