import { Link } from 'react-router-dom'
import { useState } from 'react'
import Navigation from './Navigation'
import Search from './Search'

function Header() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo/Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group flex-shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 font-semibold text-base leading-tight group-hover:text-blue-600 transition-colors">
                One Piece of Data<sup className="text-xs text-orange-500 ml-1">beta</sup>
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <Navigation />

            {/* Feedback Link */}
            <a
              href="https://github.com/ismailsunni/onepieceofdata-react/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
              title="Report an issue or suggest a feature"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>Feedback</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Search</h2>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
